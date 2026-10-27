import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button, Card, Chip, Field, Ring, Row, Screen, Txt, useTheme } from '../../components/ui';
import { useStore } from '../../store';
import { clock, elapsed } from '../../utils/domain';
import type { Mode } from '../../types';
import { useNow } from '../../hooks/useNow';
export default function Focus() {
    const params = useLocalSearchParams<{
        goalId?: string;
        stepId?: string;
    }>();
    return <FocusContent key={`${params.goalId}/${params.stepId}`} params={params} />;
}
function FocusContent({params}: {params: {goalId?: string; stepId?: string}}) {
    const state = useStore();
    const active = state.sessions.find(s => s.status !== 'completed');
    const [goalId, setGoalId] = useState(params.goalId ?? state.goals[0]?.id ?? '');
    const [stepId, setStepId] = useState<string | null>(params.stepId ?? null);
    const [mode, setMode] = useState<Mode>('countdown');
    const [duration, setDuration] = useState(String(state.preferences.defaultFocusDuration));
    const now = useNow(500);
    const [dismissed, setDismissed] = useState<string | null>(null);
    const latest = state.sessions[0];
    const celebration = !active && latest?.status === 'completed' && latest.id !== dismissed && now - (latest.endedAt ?? 0) < 60000;
    const lastMode = latest?.mode;
    const t = useTheme();
    useEffect(() => { const timer = setInterval(() => { void useStore.getState().reconcile().catch(() => {}); }, 500); return () => clearInterval(timer); }, []);
    const goal = state.goals.find(g => g.id === (active?.goalId ?? goalId));
    const passed = active ? elapsed(active, now) : 0;
    const seconds = active ? active.mode === 'stopwatch' ? passed : active.plannedDuration - passed : Number(duration) * 60;
    const p = active ? active.mode === 'stopwatch' ? (passed % 3600) / 3600 : passed / active.plannedDuration : 0;
    return <Screen><Row style={{ justifyContent: 'space-between' }}><Txt size={13} color={t.primary} bold>SPACE FOR ONE THING</Txt><Chip title={state.preferences.minimal ? 'Full view' : 'Minimal'} active={state.preferences.minimal} onPress={() => { void state.prefs({ minimal: !state.preferences.minimal }); }}/></Row><Txt size={32} bold>{active?.phase === 'break' ? 'Take a little breather.' : 'Find your flow.'}</Txt>{!state.preferences.minimal && <Txt color={t.muted}>One thing at a time. You’re right where you need to be.</Txt>}{!active && !celebration && <><Row style={{ flexWrap: 'wrap' }}>{(['countdown', 'stopwatch', 'pomodoro'] as Mode[]).map(m => <Chip key={m} title={m[0].toUpperCase() + m.slice(1)} active={mode === m} onPress={() => setMode(m)}/>)}</Row><Txt bold>Your focus today</Txt><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{state.goals.map(g => <Chip key={g.id} title={`${g.emoji} ${g.title}`} active={goalId === g.id} onPress={() => { setGoalId(g.id); setStepId(null); }}/>)}</View>{goal && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><Chip title="Whole goal" active={!stepId} onPress={() => setStepId(null)}/>{goal.steps.filter(s => !s.completedAt).map(s => <Chip key={s.id} title={s.title} active={s.id === stepId} onPress={() => setStepId(s.id)}/>)}</View>}{mode !== 'stopwatch' && <><Row>{[15, 25, 45, 60].map(n => <Chip key={n} title={`${n} min`} active={Number(duration) === n} onPress={() => setDuration(String(n))}/>)}</Row><Field label="Custom focus minutes (1–180)" value={duration} keyboardType="numeric" onChangeText={setDuration}/></>}</>}
 <Animated.View entering={state.preferences.reducedMotion ? undefined : FadeIn.duration(450)} style={{ alignItems: 'center', paddingVertical: 20 }}><Ring value={p} size={280} color={goal?.color}><Txt size={38}>{goal?.emoji ?? '🌿'}</Txt><Txt size={53} bold style={{ fontVariant: ['tabular-nums'] }}>{clock(seconds)}</Txt><Txt size={12} color={t.muted}>{active?.status === 'paused' ? 'A MOMENT TO BREATHE' : active ? 'YOU’RE MAKING PROGRESS' : 'YOUR LITTLE POCKET OF FOCUS'}</Txt></Ring></Animated.View><View style={{ alignItems: 'center', gap: 6 }}><Txt bold size={21}>{goal?.title ?? 'Choose a goal to begin'}</Txt><Txt color={t.muted}>{goal?.steps.find(s => s.id === (active?.stepId ?? stepId))?.title ?? 'Small steps create big results.'}</Txt></View>{celebration ? <Card><Txt size={32}>🎉</Txt><Txt bold size={23}>Look at you, making progress!</Txt><Txt color={t.muted}>{Math.floor((state.sessions[0]?.actualDuration ?? 0) / 60)} minutes just for what matters.</Txt>{lastMode === 'pomodoro' && state.sessions[0]?.phase === 'focus' && <Button title={`Take a ${state.preferences.breakDuration}-minute break`} onPress={async () => { await state.start(state.sessions[0].goalId, null, 'pomodoro', state.preferences.breakDuration, 'break'); setDismissed(latest?.id ?? null); }}/>}<Button title="Ready for another little step" onPress={() => setDismissed(latest?.id ?? null)}/></Card> : active ? <><Button title={active.status === 'running' ? 'Ⅱ  Pause focus' : '▶  Resume focus'} onPress={state.toggle}/><Button title="✓ Finish session" secondary onPress={() => Alert.alert('Finish this session?', 'Your focused time will be saved.', [{ text: 'Keep going', style: 'cancel' }, { text: 'Finish', onPress: () => { void state.finish().catch(e => Alert.alert('Could not save', String(e))); } }])}/><Button title="◉ Keep your goal in sight" secondary onPress={() => router.push('/bubble')}/></> : <Button disabled={!goal || !Number.isFinite(Number(duration)) || Number(duration) < 1 || Number(duration) > 180} title="▶  Start my focus" onPress={() => state.start(goalId, stepId, mode, Number(duration))}/>}{!state.preferences.minimal && <Txt color={t.muted} size={12} style={{ textAlign: 'center' }}>“What you do every day matters more than what you do once in a while.”</Txt>}</Screen>;
}
