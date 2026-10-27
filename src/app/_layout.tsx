import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store';
import { Button, Txt, useTheme } from '../components/ui';
import { useSessionBridge } from '../services/sessionBridge';
export default function Layout() { const ready = useStore(s => s.ready); const error = useStore(s => s.error); const t = useTheme(); useEffect(() => { void useStore.getState().init(); }, []); useSessionBridge(); return <GestureHandlerRootView style={{ flex: 1 }}><StatusBar style={t.dark ? 'light' : 'dark'}/>{!ready ? <View style={{ flex: 1, justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator color="#7C5CFC"/></View> : error ? <View style={{ flex: 1, padding: 30, justifyContent: 'center', gap: 20, backgroundColor: t.bg }}><Txt bold>We couldn’t save your progress</Txt><Txt>{error}</Txt><Button title="Reload saved data" onPress={() => useStore.getState().init()}/></View> : <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}><Stack.Screen name="(tabs)"/><Stack.Screen name="create" options={{ presentation: 'modal' }}/><Stack.Screen name="goal/[id]"/><Stack.Screen name="bubble" options={{ presentation: 'modal' }}/><Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }}/></Stack>}</GestureHandlerRootView>; }
