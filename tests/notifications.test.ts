import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function loadService(platform: string, available: boolean, fails = false) {
  let imports = 0;
  const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
  const api = { requestPermissionsAsync: async () => ({ granted: true }) };
  const source = ts.transpileModule(readFileSync('src/services/notifications.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  runInNewContext(source, {
    exports,
    console: { warn() {} },
    require(name: string) {
      if (name === 'react-native') return { Platform: { OS: platform } };
      if (name === 'expo-modules-core') return { requireOptionalNativeModule: () => available ? {} : null };
      if (name === 'expo-notifications') {
        imports++;
        if (fails) throw Error("Cannot find native module 'ExpoTopicSubscriptionModule'");
        return api;
      }
      throw Error(`Unexpected import: ${name}`);
    },
  });
  return { service: exports, imports: () => imports, api };
}

test('route startup never eagerly evaluates the notifications package', () => {
  const loaded = loadService('android', true, true);
  assert.equal(loaded.imports(), 0);
});

test('a client missing the native topic module can skip notifications safely', async () => {
  const loaded = loadService('android', false);
  assert.equal(await loaded.service.getNotifications(), null);
  assert.equal(loaded.imports(), 0);
  await assert.rejects(loaded.service.requireNotifications(), /updated FocusBubble development build/);
});

test('a compatible development build lazily loads the real notification API once', async () => {
  const loaded = loadService('android', true);
  const api = await loaded.service.requireNotifications() as typeof loaded.api;
  assert.equal(api.requestPermissionsAsync, loaded.api.requestPermissionsAsync);
  await loaded.service.getNotifications();
  assert.equal(loaded.imports(), 1);
});

test('web skips native notifications and an unexpected load failure stays isolated', async () => {
  const web = loadService('web', true);
  assert.equal(await web.service.getNotifications(), null);
  assert.equal(web.imports(), 0);
  const broken = loadService('android', true, true);
  assert.equal(await broken.service.getNotifications(), null);
  assert.equal(await broken.service.getNotifications(), null);
  assert.equal(broken.imports(), 1);
});
