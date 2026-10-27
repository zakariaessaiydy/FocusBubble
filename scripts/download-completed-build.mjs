import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { completedPreviewArtifact, validateTag } from './release-utils.mjs';

const tag = validateTag(process.env.RELEASE_TAG);
const buildId = process.env.EAS_BUILD_ID;
if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(buildId ?? '')) throw Error('Invalid Expo build ID.');
if (!process.env.EXPO_TOKEN) throw Error('EXPO_TOKEN repository secret is required.');
const build = JSON.parse(execFileSync('npx', ['--yes', 'eas-cli@latest', 'build:view', buildId, '--json'], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 16 * 1024 * 1024,
}));
const project = JSON.parse(await readFile('app.json', 'utf8')).expo.extra.eas.projectId;
const { url, id } = completedPreviewArtifact(build, project);
const response = await fetch(url, { signal: AbortSignal.timeout(5 * 60 * 1000) });
if (!response.ok) throw Error(`APK download failed: HTTP ${response.status}`);
const apk = Buffer.from(await response.arrayBuffer());
if (apk.length < 4 || apk[0] !== 0x50 || apk[1] !== 0x4b) throw Error('Downloaded file is not an Android archive.');
const filename = `FocusBubble-${tag}.apk`;
await mkdir('release-artifacts', { recursive: true });
await writeFile(`release-artifacts/${filename}`, apk);
await writeFile('release-artifacts/SHA256SUMS.txt', `${createHash('sha256').update(apk).digest('hex')}  ${filename}\n`);
await writeFile('release-artifacts/build-info.json', JSON.stringify({ tag, buildId: id, commit: build.gitCommitHash, version: build.appVersion, versionCode: build.appBuildVersion, profile: build.buildProfile, filename }, null, 2));
console.log(`Downloaded ${filename} (${apk.length} bytes) from successful build ${id}.`);
