import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Ring, Row, Screen, Txt, useTheme } from '../components/ui';
import { useStore } from '../store';
export default function Onboarding() {
    const [page, setPage] = useState(0);
    const t = useTheme();
    const titles = ['Big dreams start with small steps.', 'Turn your goals into a simple plan.', 'Keep your focus close.'];
    const bodies = ['A softer, simpler way to make room for what matters to you.', 'Give your dream a direction. Then take it one lovely little step at a time.', 'On Android, a tiny floating timer can keep your goal in sight, even in other apps. Always your choice.'];
    return <Screen><Txt bold size={20}>focusbubble.</Txt><LinearGradient colors={['#EAE3FF', '#DEF6F0']} style={{ height: 330, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>{page === 0 ? <><Txt size={100}>🌱</Txt><Txt color="#7150E8" bold>GROW AT YOUR OWN PACE</Txt></> : page === 1 ? <View style={{ gap: 18 }}>{['✓ A dream worth chasing', '✓ One small step', '○ A whole new chapter'].map(v => <Txt key={v} bold color="#7150E8" size={20}>{v}</Txt>)}</View> : <Ring value={0.35} size={180}><Txt size={45}>🎯</Txt><Txt size={30} bold color="#20243A">18:45</Txt></Ring>}</LinearGradient><Txt size={34} bold>{titles[page]}</Txt><Txt color={t.muted} size={17}>{bodies[page]}</Txt><Row style={{ justifyContent: 'center', padding: 16 }}>{titles.map((_, i) => <View key={i} style={{ height: 7, width: i === page ? 28 : 7, borderRadius: 5, backgroundColor: i === page ? '#7C5CFC' : t.line }}/>)}</Row><Button title={page === 2 ? 'Create my first goal' : 'That sounds like me →'} onPress={async () => {
            if (page < 2)
                setPage(page + 1);
            else {
                await useStore.getState().prefs({ onboardingDone: true });
                router.replace('/create');
            }
        }}/><Button title="Explore first" secondary onPress={async () => { await useStore.getState().prefs({ onboardingDone: true }); router.back(); }}/></Screen>;
}
