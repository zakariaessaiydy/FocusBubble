# GitHub → Expo build → downloadable APK

The repository includes checks and an Android release workflow. Version tags trigger Expo EAS builds; a successful signed APK is attached to a GitHub **prerelease** with a checksum. This preview build contains native Kotlin code and a bundled JavaScript app, so a phone can test it without Expo Go or Metro.

## One-time account setup

1. Create or choose your GitHub repository and push this project, including `.github/`, `modules/`, `eas.json` and the npm lockfile.
2. Sign in to your own Expo account and link a project:

   ```sh
   npx eas-cli@latest login
   npx eas-cli@latest init
   npx eas-cli@latest build --platform android --profile preview
   ```

   The first interactive build sets up the project and Android signing key. Let EAS generate/manage the keystore if you do not already have one. Commit the resulting `app.json` project ID and owner configuration. Keep the same project and key for future updates.
3. Create an Expo access token in your account settings. In GitHub **Settings → Secrets and variables → Actions**, add a repository secret named **EXPO_TOKEN**. Enter the token directly into GitHub; do not put it in source code or chat.
4. Enable GitHub Actions for the repository. The release workflow uses its built-in GitHub token with `contents: write`; no separate GitHub token is needed for releases.

The first build is required before CI can run non-interactively: Expo project linkage and signing credentials cannot be invented by the workflow. EAS usage and queue limits apply to your Expo account.

## Make a downloadable testing release

After committing the app and setup:

```sh
git tag v1.0.0-preview.1
git push origin v1.0.0-preview.1
```

Open GitHub **Actions → Build Android APK and GitHub release**. It validates the tag and configuration, installs with `npm ci`, runs typecheck/lint/tests, builds with EAS and waits, downloads the APK, saves a workflow artifact, then creates the GitHub prerelease. You can also use **Run workflow** with an existing version tag. An existing release is never silently overwritten; use a new tag for another build.

Download `FocusBubble-v1.0.0-preview.1.apk` under **Releases → Assets** on your phone. Private-repository downloads require GitHub sign-in. Public-repository releases are public. Follow the device checklist in README and the release notes to test overlays, notifications and lifecycle behavior.

Normal branch pushes and pull requests run checks only. Android builds run only for version tags or a manual release workflow. No Google Play submission is configured. The `production` profile generates a store bundle; use `preview` for direct APK downloads.

## Troubleshooting

- **Missing EXPO_TOKEN / projectId:** finish the one-time setup and commit its configuration.
- **Missing signing credentials:** complete the interactive preview build once from your terminal.
- **Native compilation failure:** inspect the EAS build logs. No GitHub release is published when the build fails.
- **APK installation rejected:** check device compatibility and the existing app’s signing key. Export data before uninstalling an older build signed with another key.
- **Bubble unavailable:** verify overlay permission in Android settings and use this standalone APK rather than Expo Go. Device restrictions still apply.
- **Workflow timed out:** check the EAS dashboard before retrying; the remote build may still be queued or running.

References: [Expo CI setup](https://docs.expo.dev/build/building-on-ci/), [Android APK builds](https://docs.expo.dev/build-reference/apk/).
