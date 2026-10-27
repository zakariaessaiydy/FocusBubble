import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { Goal } from '../types';
import { progress } from '../utils/domain';
import { Card, Ring, Row, Txt, useTheme } from './ui';
export function GoalCard({ goal }: {
    goal: Goal;
}) { const t = useTheme(); const p = progress(goal); return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${goal.title}, ${Math.round(p * 100)} percent complete`} onPress={() => router.push(`/goal/${goal.id}`)}><Card><Row><View style={{ width: 52, height: 52, backgroundColor: `${goal.color}18`, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Txt size={27}>{goal.emoji}</Txt></View><View style={{ flex: 1 }}><Txt bold size={17}>{goal.title}</Txt><Txt size={12} color={t.muted}>{goal.category} · {goal.steps.filter(s => s.completedAt).length}/{goal.steps.length} steps</Txt></View><Ring value={p} size={52} color={goal.color}><Txt size={11} bold>{Math.round(p * 100)}%</Txt></Ring></Row><Txt size={13} color={t.muted}>{goal.steps.find(s => !s.completedAt)?.title ?? 'Your next chapter is waiting ✨'}</Txt></Card></Pressable>; }
