import { Alert, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, Field, Row, Screen, Txt, useTheme } from '../../components/ui';
import { useStore } from '../../store';
import { defaults } from '../../utils/domain';
import { enableNotifications, scheduleReminder } from '../../services/sessionBridge';
import { exportData, importData } from '../../services/backup';
import { bubble } from '../../../modules/focus-bubble';
function Toggle({ label, value, onChange }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) { return <Row style={{ justifyContent: 'space-between' }}><View style={{ flex: 1 }}><Txt>{label}</Txt></View><Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: '#7C5CFC' }}/></Row>; }
export default function Settings() {
    const { preferences: p, prefs } = useStore();
    const t = useTheme();
    function update(patch: Parameters<typeof prefs>[0]) { void prefs(patch).catch(e => Alert.alert('Could not save', String(e))); }
    return <Screen><Txt size={13} bold color={t.primary}>MAKE YOURSELF AT HOME</Txt><Txt size={32} bold>Your space.{'\n'}Your pace.</Txt><Txt color={t.muted}>A few little things to make FocusBubble feel like you.</Txt><Card><Txt bold size={19}>The look & feel</Txt><Row>{(['light', 'dark', 'system'] as const).map(v => <Chip key={v} title={v} active={p.theme === v} onPress={() => update({ theme: v })}/>)}</Row><Toggle label="Gentle haptics" value={p.hapticsEnabled} onChange={v => update({ hapticsEnabled: v })}/><Toggle label="Reduced motion" value={p.reducedMotion} onChange={v => update({ reducedMotion: v })}/><Toggle label="Show focus days" value={p.streaks} onChange={v => update({ streaks: v })}/></Card><Card><Txt bold size={19}>Your focus rhythm</Txt><Txt size={12} color={t.muted}>Default focus duration</Txt><Row style={{ flexWrap: 'wrap' }}>{[15, 25, 45, 60].map(v => <Chip key={v} title={`${v} min`} active={p.defaultFocusDuration === v} onPress={() => update({ defaultFocusDuration: v })}/>)}</Row><Txt size={12} color={t.muted}>Pomodoro break</Txt><Row>{[5, 10, 15].map(v => <Chip key={v} title={`${v} min`} active={p.breakDuration === v} onPress={() => update({ breakDuration: v })}/>)}</Row></Card><Card><Txt bold size={19}>Your floating companion</Txt><Txt color={t.muted} size={13}>{bubble ? `Permission: ${bubble.hasPermission() ? 'allowed' : 'not enabled'}` : 'Android development build required'}</Txt><Button title="Floating bubble & permission" secondary onPress={() => router.push('/bubble')}/><Txt color={t.muted} size={12}>Bubble size</Txt><Row>{[56, 68, 80].map(v => <Chip key={v} title={`${v} dp`} active={p.bubbleSize === v} onPress={() => update({ bubbleSize: v })}/>)}</Row><Txt color={t.muted} size={12}>Bubble opacity</Txt><Row>{[0.5, 0.75, 1].map(v => <Chip key={v} title={`${v * 100}%`} active={p.bubbleOpacity === v} onPress={() => update({ bubbleOpacity: v })}/>)}</Row><Toggle label="Double tap to pause or resume" value={p.doubleTap} onChange={v => update({ doubleTap: v })}/><Txt size={12} color={t.muted}>Your bubble uses your goal’s color and emoji.</Txt></Card><Card><Txt size={19} bold>Little nudges</Txt><Toggle label="Daily reminder & timer alerts" value={p.notificationsEnabled} onChange={v => {
            void (async () => {
                if (v)
                    await enableNotifications();
                await prefs({ notificationsEnabled: v });
                await scheduleReminder();
            })().catch(e => Alert.alert('Notifications', String(e)));
        }}/><Field label="Daily reminder hour (0–23)" keyboardType="numeric" value={String(p.reminderHour)} onChangeText={v => {
            const n = Number(v);
            if (Number.isInteger(n) && n >= 0 && n < 24)
                update({ reminderHour: n });
        }}/><Field label="Quiet hours start (0–23)" keyboardType="numeric" value={String(p.quietStart)} onChangeText={v => {
            const n = Number(v);
            if (Number.isInteger(n) && n >= 0 && n < 24)
                update({ quietStart: n });
        }}/><Field label="Quiet hours end (0–23)" keyboardType="numeric" value={String(p.quietEnd)} onChangeText={v => {
            const n = Number(v);
            if (Number.isInteger(n) && n >= 0 && n < 24)
                update({ quietEnd: n });
        }}/><Button title="Save reminder schedule" secondary onPress={scheduleReminder}/><Txt size={12} color={t.muted}>One gentle nudge daily. Reminders inside your quiet hours are skipped.</Txt></Card><Card><Txt size={19} bold>Always yours</Txt><Txt color={t.muted}>Your goals live on this device. Export a backup to keep them safe.</Txt><Button title="Export my data" secondary onPress={exportData}/><Button title="Import a backup" secondary onPress={() => Alert.alert('Replace local data?', 'Import replaces your goals, history and preferences. Export a backup first.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Choose backup', onPress: () => { void importData().catch(e => Alert.alert('Import failed', String(e))); } }])}/><Button title="Clear all local data" secondary onPress={() => Alert.alert('Start fresh?', 'All goals, roadmaps and focus history will be permanently deleted.', [{ text: 'Keep my data', style: 'cancel' }, { text: 'Delete everything', style: 'destructive', onPress: () => { void (async () => { await bubble?.stop(); await useStore.getState().commit({ goals: [], sessions: [], preferences: { ...defaults, onboardingDone: true } }); await scheduleReminder(); })().catch(e => Alert.alert('Could not clear data', String(e))); } }])}/></Card><Txt size={12} color={t.muted} style={{ textAlign: 'center' }}>FocusBubble · Keep your goals visible.{'\n'}Made for progress. Made for you.</Txt></Screen>;
}
