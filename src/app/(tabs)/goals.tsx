import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Txt, Button, Chip, Row, Field, Card, useTheme } from '../../components/ui';
import { GoalCard } from '../../components/GoalCard';
import { useStore } from '../../store';
import { progress } from '../../utils/domain';
export default function Goals() { const goals = useStore(s => s.goals); const [filter, setFilter] = useState('All'); const [query, setQuery] = useState(''); const t = useTheme(); const list = goals.filter(g => g.title.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || (filter === 'Growing' ? progress(g) < 1 : progress(g) === 1))); return <Screen><Txt size={13} color={t.primary} bold>YOUR OWN LITTLE UNIVERSE</Txt><Txt size={32} bold>Dream it. Grow it.</Txt><Txt color={t.muted}>A home for the things you want to become.</Txt><Button title="＋ New goal" onPress={() => router.push('/create')}/><Field label="Find a goal" value={query} onChangeText={setQuery} placeholder="Search your dreams…"/><Row>{['All', 'Growing', 'Achieved'].map(f => <Chip key={f} title={f} active={f === filter} onPress={() => setFilter(f)}/>)}</Row><View style={{ gap: 14 }}>{list.map(g => <GoalCard key={g.id} goal={g}/>)}</View>{!list.length && <Card><Txt size={40}>🌿</Txt><Txt bold>No goals here yet.</Txt><Txt color={t.muted}>There’s space for something wonderful.</Txt></Card>}</Screen>; }
