import { useNow } from '../../hooks/useNow';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Button, Card, Field, Ring, Row, Screen, Txt, useTheme } from '../../components/ui';
import { useStore } from '../../store';
import { dayKey, id as makeId, progress } from '../../utils/domain';
import type { Step } from '../../types';
export default function GoalDetail() {
    const { id } = useLocalSearchParams<{
        id: string;
    }>();
    const { goals, sessions, upsertGoal, deleteGoal } = useStore();
    const goal = goals.find(g => g.id === id);
    const [editing, setEditing] = useState<Step | null>(null);
    const now = useNow();
    const t = useTheme();
    if (!goal)
        return <Screen><Txt>That goal isn’t here.</Txt><Button title="Go back" onPress={() => router.back()}/></Screen>;
    const g = goal;
    const done = sessions.filter(s => s.goalId === id && s.status === 'completed' && s.phase === 'focus');
    const today = dayKey(now);
    const minutes = (ss: typeof done) => Math.floor(ss.reduce((a, s) => a + s.actualDuration, 0) / 60);
    async function update(steps: Step[]) { await upsertGoal({ ...g, steps, updatedAt: now }); }
    async function reorder(index: number, direction: number) {
        const steps = [...g.steps];
        const next = index + direction;
        if (next < 0 || next >= steps.length)
            return;
        [steps[index], steps[next]] = [steps[next], steps[index]];
        await update(steps);
    }
    return <Screen><Row style={{ justifyContent: 'space-between' }}><Button title="← Back" secondary onPress={() => router.back()}/><Button title="Edit goal" secondary onPress={() => router.push({ pathname: '/create', params: { edit: id } })}/></Row><View style={{ alignItems: 'center', gap: 12 }}><Txt size={56}>{g.emoji}</Txt><Txt size={30} bold style={{ textAlign: 'center' }}>{g.title}</Txt><Txt color={t.muted}>{g.category} · {g.targetDate || 'At your own pace'}</Txt><Ring value={progress(g)} color={g.color}><Txt size={42} bold>{Math.round(progress(g) * 100)}%</Txt><Txt size={13} color={t.muted}>closer to your dream</Txt></Ring></View><Card style={{ backgroundColor: t.dark ? t.card : '#EEE8FF' }}><Txt color={t.primary} bold size={12}>YOUR WHY 💜</Txt><Txt>{g.motivation || 'Small steps create big results.'}</Txt></Card><Button title="▶ Focus on this goal" onPress={() => router.push({ pathname: '/focus', params: { goalId: id } })}/><Row style={{ justifyContent: 'space-between' }}><Txt size={22} bold>Your roadmap</Txt><Txt color={t.muted} size={12}>Hold & drag to reorder</Txt></Row>{g.steps.map((step, i) => <RoadmapStep key={step.id} step={step} index={i} color={g.color} onDrag={d => { void reorder(i, d).catch(e => Alert.alert('Could not reorder', String(e))); }}><Card><Row><Button title={step.completedAt ? '✓' : String(i + 1).padStart(2, '0')} secondary={!step.completedAt} onPress={() => update(g.steps.map(s => s.id === step.id ? { ...s, completedAt: s.completedAt ? null : Date.now() } : s))}/><View style={{ flex: 1 }}><Txt bold>{step.title}</Txt><Txt color={t.muted} size={12}>{step.estimatedMinutes} min {step.deadline ? `· ${step.deadline}` : ''}</Txt></View></Row>{!!step.description && <Txt size={13} color={t.muted}>{step.description}</Txt>}{step.subtasks.map((sub, j) => <Button key={j} title={`${sub.done ? '☑' : '○'} ${sub.title}`} secondary onPress={() => update(g.steps.map(s => s.id === step.id ? { ...s, subtasks: s.subtasks.map((x, k) => k === j ? { ...x, done: !x.done } : x) } : s))}/>)}<Row style={{ flexWrap: 'wrap' }}><Button title="Focus" onPress={() => router.push({ pathname: '/focus', params: { goalId: id, stepId: step.id } })}/><Button title="Edit" secondary onPress={() => setEditing({ ...step })}/><Button title="↑" secondary onPress={() => reorder(i, -1)}/><Button title="↓" secondary onPress={() => reorder(i, 1)}/></Row></Card></RoadmapStep>)}{!g.steps.length && <Txt color={t.muted}>What’s one small step you can take?</Txt>}<Button title="＋ Add a step" secondary onPress={() => setEditing({ id: makeId(), title: '', description: '', estimatedMinutes: 25, deadline: '', completedAt: null, subtasks: [] })}/>{editing && <Card><Txt bold size={20}>Shape your next step</Txt><Field label="Step title" value={editing.title} onChangeText={title => setEditing({ ...editing, title })}/><Field label="A little more detail" multiline value={editing.description} onChangeText={description => setEditing({ ...editing, description })}/><Field label="Estimated minutes" keyboardType="numeric" value={String(editing.estimatedMinutes)} onChangeText={v => setEditing({ ...editing, estimatedMinutes: Number(v) || 0 })}/><Field label="Deadline (YYYY-MM-DD), optional" value={editing.deadline} onChangeText={deadline => setEditing({ ...editing, deadline })}/><Field label="Subtasks (one per line)" multiline value={editing.subtasks.map(s => s.title).join('\n')} onChangeText={v => setEditing({ ...editing, subtasks: v.split('\n').map((title, i) => ({ title, done: editing.subtasks[i]?.done ?? false })) })}/><Button disabled={!editing.title.trim()} title="Save step" onPress={async () => {
                if (editing.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(editing.deadline) || isNaN(Date.parse(editing.deadline))))
                    throw Error('Use YYYY-MM-DD for the deadline.');
                await update([...g.steps.filter(s => s.id !== editing.id), editing].sort((a, b) => { const ai = g.steps.findIndex(s => s.id === a.id); const bi = g.steps.findIndex(s => s.id === b.id); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); }));
                setEditing(null);
            }}/><Button title="Cancel" secondary onPress={() => setEditing(null)}/>{g.steps.some(s => s.id === editing.id) && <Button title="Delete step" secondary onPress={() => Alert.alert('Delete this step?', 'This removes the step and its subtasks.', [{ text: 'Keep it', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void update(g.steps.filter(s => s.id !== editing.id)).then(() => setEditing(null)).catch(e => Alert.alert('Could not delete', String(e))); } }])}/>}</Card>}<Txt size={22} bold>Time well spent</Txt><Row>{[[minutes(done), 'total min'], [minutes(done.filter(s => dayKey(s.endedAt!) === today)), 'today'], [done.length, 'sessions']].map(([v, l]) => <Card key={l} style={{ flex: 1, padding: 12 }}><Txt bold size={22}>{v}</Txt><Txt size={11} color={t.muted}>{l}</Txt></Card>)}</Row><Txt color={t.muted}>This week: {minutes(done.filter(s => s.startedAt >= now - 7 * 86400000))} minutes</Txt><Button title="Delete goal" secondary onPress={() => Alert.alert('Delete this goal?', 'Its roadmap and focus history will also be removed.', [{ text: 'Keep it', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void deleteGoal(id).then(() => router.back()).catch(e => Alert.alert('Could not delete', String(e))); } }])}/></Screen>;
}
function RoadmapStep({ children, onDrag }: {
    children: React.ReactNode;
    step: Step;
    index: number;
    color: string;
    onDrag: (d: number) => void;
}) {
    const drag = Gesture.Pan().activateAfterLongPress(350).onEnd(e => {
        if (Math.abs(e.translationY) > 35)
            scheduleOnRN(onDrag, e.translationY > 0 ? 1 : -1);
    });
    return <GestureDetector gesture={drag}><View>{children}</View></GestureDetector>;
}

