import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Field, Row, Screen, Txt, palette, useTheme } from '../components/ui';
import { useStore } from '../store';
import { id } from '../utils/domain';
import type { Goal, Step } from '../types';
export default function Create() {
    const { edit } = useLocalSearchParams<{
        edit?: string;
    }>();
    const original = useStore(s => s.goals.find(g => g.id === edit));
    const [page, setPage] = useState(0);
    const [title, setTitle] = useState(original?.title ?? '');
    const [why, setWhy] = useState(original?.motivation ?? '');
    const [target, setTarget] = useState(original?.targetDate ?? '');
    const [type, setType] = useState<'short' | 'long'>(original?.type ?? 'short');
    const [steps, setSteps] = useState<Step[]>(original?.steps ?? []);
    const [step, setStep] = useState('');
    const [emoji, setEmoji] = useState(original?.emoji ?? '🎯');
    const [color, setColor] = useState(original?.color ?? palette[0]);
    const [category, setCategory] = useState(original?.category ?? 'Personal');
    const [priority, setPriority] = useState(original?.priority ?? 1);
    const t = useTheme();
    const headings = ['What’s your big dream?', 'Find your reason.', 'Give it a horizon.', 'Small steps. Big things.', 'Make it yours.', 'Your journey starts now!'];
    const hints = ['It doesn’t have to be perfect. Just make it yours.', 'On the hard days, this is what brings you back.', 'A date is a direction, not a reason to feel pressure.', 'Turn “someday” into something you can do today.', 'A little personality goes a long way.', 'You’ve already taken the first step.'];
    const valid = page === 0 ? !!title.trim() : page === 2 ? !target || /^\d{4}-\d{2}-\d{2}$/.test(target) && !isNaN(Date.parse(target)) : true;
    async function complete() { const now = Date.now(); const goal: Goal = { id: original?.id ?? id(), title: title.trim(), description: original?.description ?? '', motivation: why.trim(), type, category, emoji, color, priority, startDate: original?.startDate ?? now, targetDate: target, status: original?.status ?? 'active', createdAt: original?.createdAt ?? now, updatedAt: now, steps }; await useStore.getState().upsertGoal(goal); router.replace(`/goal/${goal.id}`); }
    function addStep() {
        if (!step.trim())
            return;
        setSteps([...steps, { id: id(), title: step.trim(), description: '', estimatedMinutes: 25, deadline: '', completedAt: null, subtasks: [] }]);
        setStep('');
    }
    return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen><Row style={{ justifyContent: 'space-between' }}><Button title="✕ Close" secondary onPress={() => router.back()}/><Txt color={t.muted} size={12}>STEP {page + 1} OF 6</Txt></Row><Row>{headings.map((_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= page ? '#7C5CFC' : t.line }}/>)}</Row><Txt size={48}>{['🌱', '💜', '🌤️', '🪴', '🎨', '🚀'][page]}</Txt><Txt size={31} bold>{headings[page]}</Txt><Txt color={t.muted}>{hints[page]}</Txt>{page === 0 && <><Field label="I want to…" value={title} onChangeText={setTitle} placeholder="Learn German B1"/><Txt size={12} color={t.muted}>NEED A LITTLE INSPIRATION?</Txt><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Learn a language', 'Read 20 books', 'Build my business', 'Make something creative'].map(v => <Chip key={v} title={v} onPress={() => setTitle(v)}/>)}</View></>}{page === 1 && <Field label="This matters to me because…" value={why} onChangeText={setWhy} multiline placeholder="I want to open a new chapter in my life."/>}{page === 2 && <><Row><Chip title="Short term" active={type === 'short'} onPress={() => setType('short')}/><Chip title="Long term" active={type === 'long'} onPress={() => setType('long')}/></Row><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(type === 'short' ? [1, 7, 30] : [90, 180, 365, 730]).map(days => <Chip key={days} title={days === 1 ? 'Today' : `${days} days`} onPress={() => { const d = new Date(); d.setDate(d.getDate() + days - 1); setTarget(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); }}/>)}</View><Field label="Target date (YYYY-MM-DD), optional" value={target} onChangeText={setTarget} placeholder="2027-12-01"/></>}{page === 3 && <><Field label="One achievable step" value={step} onChangeText={setStep} placeholder="Practice vocabulary for 10 minutes"/><Button title="＋ Add step" secondary onPress={addStep}/>{steps.map((s, i) => <Card key={s.id}><Row><Txt color={t.primary} bold>{String(i + 1).padStart(2, '0')}</Txt><View style={{ flex: 1 }}><Txt>{s.title}</Txt></View><Button title="×" secondary onPress={() => setSteps(steps.filter(x => x.id !== s.id))}/></Row></Card>)}<Txt color={t.muted} size={12}>You can add deadlines, subtasks and details in your roadmap.</Txt></>}{page === 4 && <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['🎯', '🎓', '💻', '🚀', '📚', '🎨', '🌿', '💪'].map(e => <Chip title={e} key={e} active={e === emoji} onPress={() => setEmoji(e)}/>)}</View><Row style={{ flexWrap: 'wrap' }}>{palette.map(c => <Chip key={c} title={c === color ? '✓' : '●'} active={c === color} onPress={() => setColor(c)}/>)}</Row><Row>{palette.map(c => <View key={c} style={{ width: 24, height: 8, backgroundColor: c, borderRadius: 4 }}/>)}</Row><Field label="Category" value={category} onChangeText={setCategory}/><Row>{[1, 2, 3].map(p => <Chip title={['', 'Gentle', 'Important', 'North star'][p]} key={p} active={priority === p} onPress={() => setPriority(p)}/>)}</Row></>}{page === 5 && <Card style={{ borderColor: color }}><Txt size={48}>{emoji}</Txt><Txt bold size={24}>{title}</Txt><Txt color={t.muted}>{why || 'A little progress every day.'}</Txt><Txt color={color}>{steps.length} small steps · {target || 'At your own pace'}</Txt></Card>}<View style={{ gap: 10, marginTop: 12 }}><Button disabled={!valid} title={page === 5 ? original ? 'Save your changes' : 'Let’s make progress!' : 'Continue →'} onPress={() => page === 5 ? complete() : setPage(page + 1)}/>{page > 0 && <Button title="← A step back" secondary onPress={() => setPage(page - 1)}/>}</View></Screen></KeyboardAvoidingView>;
}
