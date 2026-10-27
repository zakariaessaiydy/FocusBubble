import { useEffect } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import { getNotifications, requireNotifications } from './notifications';
import { bubble, type BubbleData } from '../../modules/focus-bubble';
import { useStore } from '../store';
import { elapsed, mergeNativeSession } from '../utils/domain';
let nativeSession: string | null = null;
let chain = Promise.resolve();
export function bubbleData(): BubbleData | null {
    const state = useStore.getState();
    const s = state.sessions.find(s => s.status !== 'completed');
    const g = state.goals.find(g => g.id === s?.goalId);
    if (!s || !g)
        return null;
    return { ...s, title: g.title, emoji: g.emoji, color: g.color, step: g.steps.find(x => x.id === s.stepId)?.title ?? '', size: state.preferences.bubbleSize, opacity: state.preferences.bubbleOpacity, doubleTap: state.preferences.doubleTap, haptics: state.preferences.hapticsEnabled, reducedMotion: state.preferences.reducedMotion };
}
async function applyNative(raw: string | null) {
    if (!raw || !useStore.getState().ready)
        return;
    const value = JSON.parse(raw);
    if (value.error) {
        Alert.alert('Bubble unavailable', value.error);
        return;
    }
    await useStore.getState().commit(state => ({ sessions: mergeNativeSession(state.sessions, value) }));
}
async function sync() {
    const state = useStore.getState();
    if (!state.ready)
        return;
    const s = state.sessions.find(s => s.status !== 'completed');
    const Notifications = await getNotifications();
    if (Notifications) await Notifications.cancelScheduledNotificationAsync('focus-completion');
    if (Notifications && s?.status === 'running' && s.mode !== 'stopwatch' && state.preferences.notificationsEnabled) {
        await Notifications.scheduleNotificationAsync({ identifier: 'focus-completion', content: { title: s.phase === 'break' ? 'Ready for your next little step? 🌱' : 'A little closer. Well done! 🎉', body: 'Open FocusBubble to see your progress.' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, s.plannedDuration - elapsed(s)) } });
    }
    if (bubble) {
        const data = bubbleData();
        if (data && state.preferences.bubbleEnabled && bubble.hasPermission()) {
            if (nativeSession === data.id && bubble.getBubbleState().data) {
                await bubble.updateBubble(data);
            }
            else if (AppState.currentState === 'active') {
                await bubble.showBubble(data);
                nativeSession = data.id;
            }
        }
        else {
            await bubble.stop();
            nativeSession = null;
        }
    }
}
export function useSessionBridge() {
    useEffect(() => {
        const queue = () => { chain = chain.then(sync).catch(e => { Alert.alert('Focus reminder unavailable', String(e)); }); };
        const unsubscribe = useStore.subscribe((s, p) => {
            if (s.sessions !== p.sessions || s.preferences !== p.preferences || s.ready !== p.ready)
                queue();
        });
        const event = bubble?.addListener('onStateChanged', event => { void applyNative(event.state).catch(e => Alert.alert('Could not restore timer', String(e))); });
        const lifecycle = AppState.addEventListener('change', state => {
            if (state === 'active' && useStore.getState().ready) {
                void applyNative(bubble?.consumeState() ?? null).then(() => useStore.getState().reconcile()).then(queue).catch(e => Alert.alert('Could not restore timer', String(e)));
            }
        });
        return () => { unsubscribe(); event?.remove(); lifecycle.remove(); };
    }, []);
}
export async function enableNotifications() {
    const Notifications = await requireNotifications();
    if (Platform.OS === 'android')
        await Notifications.setNotificationChannelAsync('focus-bubble', { name: 'Active focus', importance: Notifications.AndroidImportance.LOW });
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted)
        throw Error('Notifications are off. You can enable them in system settings.');
}
export async function scheduleReminder() {
    const p = useStore.getState().preferences;
    const Notifications = p.notificationsEnabled ? await requireNotifications() : await getNotifications();
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync('daily-reminder');
    if (!p.notificationsEnabled)
        return;
    const quiet = p.quietStart > p.quietEnd ? p.reminderHour >= p.quietStart || p.reminderHour < p.quietEnd : p.reminderHour >= p.quietStart && p.reminderHour < p.quietEnd;
    if (quiet)
        return;
    await Notifications.scheduleNotificationAsync({ identifier: 'daily-reminder', content: { title: 'A little space for your dreams? 🌱', body: 'Just ten minutes can be a lovely place to start.' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: p.reminderHour, minute: 0 } });
}

