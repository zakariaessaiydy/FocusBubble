import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '../store';
import { defaults, validateSnapshot } from '../utils/domain';
export async function exportData() {
    const { goals, sessions, preferences } = useStore.getState();
    const file = new File(Paths.cache, 'focusbubble-backup.json');
    file.write(JSON.stringify({ version: 1, goals, sessions, preferences }, null, 2));
    if (!await Sharing.isAvailableAsync())
        throw Error('File sharing is not available on this device.');
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Your FocusBubble backup' });
}
export async function importData() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (result.canceled)
        return;
    if (useStore.getState().sessions.some(s => s.status !== 'completed'))
        throw Error('Finish the current session before importing.');
    const value = JSON.parse(await new File(result.assets[0].uri).text());
    validateSnapshot(value);
    await useStore.getState().commit({ goals: value.goals, sessions: value.sessions, preferences: { ...defaults, ...value.preferences, bubbleEnabled: false } });
    await useStore.getState().reconcile();
}
