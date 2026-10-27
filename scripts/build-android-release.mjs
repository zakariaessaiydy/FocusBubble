import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildArtifact, validateTag } from './release-utils.mjs';

const tag = validateTag(process.env.RELEASE_TAG);
console.log('Submitting preview APK to EAS and waiting for the signed build…');
const output = execFileSync('npx', [
  '--yes', 'eas-cli@latest', 'build', '--platform', 'android',
  '--profile', 'preview', '--non-interactive', '--wait', '--json',
], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 16 * 1024 * 1024 });
const { url, id } = buildArtifact(JSON.parse(output));
const response = await fetch(url, { signal: AbortSignal.timeout(5 * 60 * 1000) });
if (!response.ok) throw Error(`APK download failed: HTTP ${response.status}`);
const apk = Buffer.from(await response.arrayBuffer());
if (apk.length < 4 || apk[0] !== 0x50 || apk[1] !== 0x4b) throw Error('Downloaded artifact is not an Android archive.');
const filename = `FocusBubble-${tag}.apk`;
const checksum = createHash('sha256').update(apk).digest('hex');
await mkdir('release-artifacts', { recursive: true });
await writeFile(`release-artifacts/${filename}`, apk);
await writeFile('release-artifacts/SHA256SUMS.txt', `${checksum}  ${filename}\n`);
await writeFile('release-artifacts/build-info.json', JSON.stringify({ tag, buildId: id, commit: process.env.GITHUB_SHA, profile: 'preview', filename }, null, 2));
console.log(`Saved ${filename} and SHA-256 checksum.`);
