import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildArtifact, completedPreviewArtifact, validateTag } from '../scripts/release-utils.mjs';

test('release tags are safe version strings', () => {
  assert.equal(validateTag('v1.0.0-preview.1'), 'v1.0.0-preview.1');
  for (const tag of ['', 'main', '../outside', 'v1.0.0;echo bad', 'v1.0.0\n']) {
    assert.throws(() => validateTag(tag));
  }
});

test('release only accepts one successful Android artifact over HTTPS', () => {
  const build = { id: 'build-id', status: 'FINISHED', platform: 'ANDROID', artifacts: { applicationArchiveUrl: 'https://example.com/app.apk' } };
  assert.equal(buildArtifact([build]).id, 'build-id');
  assert.equal(buildArtifact(build).url.href, 'https://example.com/app.apk');
  assert.throws(() => buildArtifact({ ...build, status: 'ERRORED' }));
  assert.throws(() => buildArtifact({ ...build, platform: 'IOS' }));
  assert.throws(() => buildArtifact([build, build]));
  assert.throws(() => buildArtifact({ ...build, artifacts: { applicationArchiveUrl: 'http://example.com/app.apk' } }));
  assert.throws(() => buildArtifact({ ...build, artifacts: {} }));
});

test('testing profile is an installable standalone APK with remote version increments', () => {
  const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
  assert.equal(eas.build.preview.android.buildType, 'apk');
  assert.equal(eas.build.preview.developmentClient, false);
  assert.equal(eas.build.preview.autoIncrement, true);
  assert.equal(eas.cli.appVersionSource, 'remote');
});

test('publishing an existing APK validates the project, preview profile and source commit', () => {
  const build = { id: 'build', status: 'FINISHED', platform: 'ANDROID', app: { id: 'project' }, buildProfile: 'preview', distribution: 'INTERNAL', gitCommitHash: 'a'.repeat(40), artifacts: { buildUrl: 'https://example.com/app.apk' } };
  assert.equal(completedPreviewArtifact(build, 'project').id, 'build');
  assert.throws(() => completedPreviewArtifact(build, 'another-project'));
  assert.throws(() => completedPreviewArtifact({ ...build, buildProfile: 'development' }, 'project'));
  assert.throws(() => completedPreviewArtifact({ ...build, gitCommitHash: 'not-a-commit' }, 'project'));
});
