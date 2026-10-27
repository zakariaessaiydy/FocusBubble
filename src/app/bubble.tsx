import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Ring, Screen, Txt, useTheme } from '../components/ui';
import { bubble } from '../../modules/focus-bubble';
import { useStore } from '../store';
import { bubbleData } from '../services/sessionBridge';
export default function Bubble() {
    const [permission, setPermission] = useState(bubble?.hasPermission() ?? false);
    const t = useTheme();
    const enabled = useStore(s => s.preferences.bubbleEnabled);
    useEffect(() => {
        const sub = AppState.addEventListener('change', s => {
            if (s === 'active')
                setPermission(bubble?.hasPermission() ?? false);
        });
        return () => sub.remove();
    }, []);
    return <Screen><Button title="← Back" secondary onPress={() => router.back()}/><Txt size={13} color={t.primary} bold>YOUR GOAL, ALWAYS IN SIGHT</Txt><Txt size={32} bold>A tiny reminder.{'\n'}A big difference.</Txt><Card style={{ alignItems: 'center', paddingVertical: 40 }}><Ring value={0.35} size={150}><Txt size={38}>🎯</Txt><Txt bold size={25}>18:45</Txt></Ring><Txt color={t.muted}>Keep your focus close.</Txt></Card><Banner title="Made for your real life" body="A small timer can float over other Android apps. Drag it to your favorite spot, or tap for pause and resume."/><Txt color={t.muted}>FocusBubble needs “Display over other apps” permission to show this bubble. It does not read your screen or block other apps. Permission is optional and can be revoked at any time.</Txt>{Platform.OS !== 'android' ? <Card><Txt bold>On iPhone and iPad</Txt><Txt color={t.muted}>System-wide floating bubbles aren’t supported. Use the focus timer and optional completion notifications instead. Live Activities are not included in this build.</Txt></Card> : !bubble ? <Card><Txt bold>A development build is needed</Txt><Txt color={t.muted}>The native bubble isn’t included in Expo Go. Install a FocusBubble Android development build to enable it.</Txt></Card> : <><Txt bold>Overlay permission: {permission ? 'Allowed ✓' : 'Not enabled'}</Txt>{!permission ? <Button title="Open Android permission settings" onPress={() => bubble?.requestPermission()}/> : <Button title={enabled ? 'Hide my bubble' : 'Enable my floating bubble'} onPress={async () => {
                    if (enabled) {
                        await useStore.getState().prefs({ bubbleEnabled: false });
                        await bubble?.stop();
                    }
                    else {
                        await useStore.getState().prefs({ bubbleEnabled: true });
                        const data = bubbleData();
                        if (data)
                            await bubble?.showBubble(data);
                    }
                }}/>}<Txt size={12} color={t.muted}>The bubble appears during an active focus session. Long press for more options. Drag to the bottom to hide it without ending your session.</Txt><Button title="Reset bubble position" secondary onPress={() => bubble?.resetPosition()}/></>}<Txt size={12} color={t.muted}>Android may hide overlays on permission dialogs, secure screens, and apps that restrict them. Some phones stop background services to save battery.</Txt></Screen>;
}
