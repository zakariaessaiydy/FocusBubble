import { useNow } from '../../hooks/useNow';
import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';
import { useStore } from '../../store';
import { Banner, Button, Card, Ring, Row, Screen, Txt, useTheme } from '../../components/ui';
import { GoalCard } from '../../components/GoalCard';
import { dayKey, progress } from '../../utils/domain';
export default function Home() {
    const { goals, sessions, preferences, ready } = useStore();
    const now = useNow();
    const t = useTheme();
    const goal = goals.filter(g => g.status === 'active').sort((a, b) => b.priority - a.priority)[0];
    const today = dayKey(now);
    const minutes = Math.floor(sessions.filter(s => s.phase === 'focus' && s.status === 'completed' && dayKey(s.endedAt!) === today).reduce((a, s) => a + s.actualDuration, 0) / 60);
    const steps = goals.flatMap(g => g.steps).filter(s => s.completedAt && dayKey(s.completedAt) === today).length;
    useEffect(() => {
        if (ready && !preferences.onboardingDone)
            router.push('/onboarding');
    }, [ready, preferences.onboardingDone]);
    return <Screen><Row style={{ justifyContent: 'space-between' }}><Row><View style={{ backgroundColor: '#EDE7FF', borderRadius: 16, padding: 12 }}><Sparkles size={23} color="#7C5CFC"/></View><Txt bold size={18}>focusbubble<TextDot /></Txt></Row><Txt size={24}>☀️</Txt></Row><View><Txt size={13} color={t.muted}>{new Date(now).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</Txt><Txt size={32} bold style={{ marginTop: 8 }}>A little focus.{'\n'}A little closer.</Txt><Txt color={t.muted} style={{ marginTop: 6 }}>Big dreams, one small step at a time.</Txt></View><Banner title="Make room for what matters ✨" body="You don’t have to do it all. Just take the next step."/><Row style={{ justifyContent: 'space-between' }}><Txt bold size={19}>Your north star</Txt><ArrowUpRight color={t.primary} size={20}/></Row>{goal ? <Card><Row><Txt size={35}>{goal.emoji}</Txt><View style={{ flex: 1 }}><Txt size={21} bold>{goal.title}</Txt><Txt size={12} color={t.muted}>{goal.targetDate ? `Your horizon · ${goal.targetDate}` : 'At your own pace'}</Txt></View></Row><View style={{ alignItems: 'center', paddingVertical: 8 }}><Ring value={progress(goal)} color={goal.color} size={176}><Txt bold size={36}>{Math.round(progress(goal) * 100)}%</Txt><Txt size={12} color={t.muted}>of your journey</Txt></Ring></View><Txt size={12} color={t.muted}>YOUR NEXT LITTLE STEP</Txt><Txt bold>{goal.steps.find(s => !s.completedAt)?.title ?? 'Set aside a little time for your goal'}</Txt><Button title="▶  Let’s focus" onPress={() => router.push({ pathname: '/focus', params: { goalId: goal.id } })}/></Card> : <Card><Txt size={42}>🌱</Txt><Txt size={21} bold>Every journey starts somewhere.</Txt><Txt color={t.muted}>Give your dream a name. We’ll help you take it from there.</Txt><Button title="＋ Create your first goal" onPress={() => router.push('/create')}/></Card>}<Row style={{ justifyContent: 'space-between' }}><Txt size={19} bold>Little wins today</Txt><Txt size={12} color={t.muted}>They all count.</Txt></Row><Row>{[[minutes, 'focus min', '⏳'], [steps, 'steps taken', '🌱'], [goals.filter(g => g.status === 'active').length, 'active goals', '🎯']].map(([v, l, e]) => <Card key={l} style={{ flex: 1, padding: 13, alignItems: 'center' }}><Txt size={22}>{e}</Txt><Txt size={24} bold>{v}</Txt><Txt size={10} color={t.muted}>{l}</Txt></Card>)}</Row><Button title="＋ Plant a new goal" secondary onPress={() => router.push('/create')}/>{goals.slice(1, 3).map(g => <GoalCard goal={g} key={g.id}/>)}<Txt size={12} color={t.muted} style={{ textAlign: 'center' }}>A softer kind of productivity. Made for you.</Txt></Screen>;
}
function TextDot() { return <Txt color="#7C5CFC">.</Txt>; }
