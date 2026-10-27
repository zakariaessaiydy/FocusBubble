import { readFileSync } from 'node:fs';
import { validateTag } from './release-utils.mjs';

validateTag(process.env.RELEASE_TAG);
if (!process.env.EXPO_TOKEN) throw Error('Add EXPO_TOKEN in GitHub repository Settings → Secrets and variables → Actions.');
const config = JSON.parse(readFileSync('app.json', 'utf8')).expo;
if (!config.extra?.eas?.projectId) {
  throw Error('Link this app to Expo first with npx eas-cli@latest init, then commit app.json.');
}
console.log('Release tag, Expo token and project linkage are configured.');
