export function validateTag(tag) {
  if (typeof tag !== 'string' || tag.trim() !== tag || !/^v\d+\.\d+\.\d+(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?$/.test(tag)) {
    throw Error('Use a version tag such as v1.0.0-preview.1.');
  }
  return tag;
}

export function buildArtifact(result) {
  const builds = Array.isArray(result) ? result : [result];
  if (builds.length !== 1) throw Error('Expected exactly one Android build.');
  const build = builds[0];
  if (String(build?.status).toUpperCase() !== 'FINISHED') {
    throw Error(`Android build did not finish successfully (${build?.status ?? 'unknown'}).`);
  }
  if (String(build.platform).toUpperCase() !== 'ANDROID') throw Error('Expected an Android build.');
  const url = new URL(build.artifacts?.applicationArchiveUrl ?? build.artifacts?.buildUrl);
  if (url.protocol !== 'https:') throw Error('Expected an HTTPS build artifact.');
  return { url, id: build.id };
}

export function completedPreviewArtifact(build, projectId) {
  if (!projectId || build.app?.id !== projectId) throw Error('Build belongs to another Expo project.');
  if (build.buildProfile !== 'preview' || build.distribution !== 'INTERNAL') throw Error('Expected a standalone internal preview APK.');
  if (!/^[a-f0-9]{40}$/i.test(build.gitCommitHash ?? '')) throw Error('Build has no valid Git commit.');
  return buildArtifact(build);
}
