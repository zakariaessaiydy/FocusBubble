import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedProps, useSharedValue, withTiming, useReducedMotion } from 'react-native-reanimated';
import { useStore } from '../store';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export const palette = ['#7C5CFC', '#239F94', '#D98B32', '#DD7193', '#4B85D4', '#839C47'];
export function useTheme() { const system = useColorScheme(); const p = useStore(s => s.preferences); const dark = p.theme === 'dark' || (p.theme === 'system' && system === 'dark'); return { dark, bg: dark ? '#171726' : '#F8F9FD', card: dark ? '#252537' : '#FFFFFF', text: dark ? '#F4F1FF' : '#20243A', muted: dark ? '#B5B2CB' : '#75758D', line: dark ? '#39394E' : '#ECEBF4', primary: dark ? '#AE98FF' : '#7150E8' }; }
export function Txt({ children, size = 15, bold = false, color, style }: {
    children: React.ReactNode;
    size?: number;
    bold?: boolean;
    color?: string;
    style?: object;
}) { const t = useTheme(); return <Text style={[{ fontSize: size, lineHeight: size * 1.45, color: color ?? t.text, fontWeight: bold ? '700' : '400' }, style]}>{children}</Text>; }
export function Screen({ children }: {
    children: React.ReactNode;
}) { const t = useTheme(); return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.bg }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 22, width: '100%', maxWidth: 700, alignSelf: 'center' }}>{children}</ScrollView></SafeAreaView>; }
export function Card({ children, style }: {
    children: React.ReactNode;
    style?: ViewStyle;
}) { const t = useTheme(); return <View style={[{ backgroundColor: t.card, borderRadius: 26, padding: 22, gap: 14, borderWidth: 1, borderColor: t.line }, style]}>{children}</View>; }
export function Row({ children, style }: {
    children: React.ReactNode;
    style?: ViewStyle;
}) { return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>{children}</View>; }
export function Button({ title, onPress, secondary = false, disabled = false }: {
    title: string;
    onPress: () => unknown;
    secondary?: boolean;
    disabled?: boolean;
}) {
    const t = useTheme();
    const haptics = useStore(s => s.preferences.hapticsEnabled);
    const [busy, setBusy] = React.useState(false);
    return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled || busy} onPress={async () => {
            setBusy(true);
            try {
                if (haptics)
                    void Haptics.selectionAsync().catch(() => { });
                await onPress();
            }
            catch (e) {
                Alert.alert('A little hiccup', e instanceof Error ? e.message : String(e));
            }
            finally {
                setBusy(false);
            }
        }} style={({ pressed }) => ({ minHeight: 50, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: secondary ? t.line : '#7C5CFC', opacity: disabled || busy ? 0.45 : pressed ? 0.75 : 1 })}>{busy ? <ActivityIndicator color={secondary ? t.text : '#fff'}/> : <Txt bold color={secondary ? t.text : '#fff'}>{title}</Txt>}</Pressable>;
}
export function Field({ label, value, onChangeText, multiline, keyboardType, placeholder }: {
    label: string;
    value: string;
    onChangeText: (s: string) => void;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric';
    placeholder?: string;
}) { const t = useTheme(); return <View style={{ gap: 8 }}><Txt bold size={13}>{label}</Txt><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} multiline={multiline} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={t.muted} style={{ backgroundColor: t.card, borderColor: t.line, borderWidth: 1, borderRadius: 16, color: t.text, padding: 16, fontSize: 16, minHeight: multiline ? 104 : 54, textAlignVertical: multiline ? 'top' : 'center' }}/></View>; }
export function Chip({ title, active, onPress }: {
    title: string;
    active?: boolean;
    onPress: () => void;
}) { const t = useTheme(); return <Pressable accessibilityRole="button" accessibilityState={{ selected: !!active }} onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 12, minHeight: 44, borderRadius: 16, backgroundColor: active ? '#7C5CFC' : t.card, borderWidth: 1, borderColor: active ? '#7C5CFC' : t.line }}><Txt size={13} bold color={active ? '#fff' : t.text}>{title}</Txt></Pressable>; }
export function Ring({ value, size = 220, color = '#7C5CFC', children }: {
    value: number;
    size?: number;
    color?: string;
    children?: React.ReactNode;
}) { const t = useTheme(); const r = (size - 18) / 2; const length = 2 * Math.PI * r; const reduced = useReducedMotion(); const preference = useStore(s => s.preferences.reducedMotion); const offset = useSharedValue(length); React.useEffect(() => { const next = length * (1 - Math.max(0, Math.min(1, value))); offset.value = reduced || preference ? next : withTiming(next, { duration: 400 }); }, [value, length, reduced, preference, offset]); const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value })); return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><Svg width={size} height={size} style={StyleSheet.absoluteFill}><Circle cx={size / 2} cy={size / 2} r={r} stroke={t.line} strokeWidth={8} fill="none"/><AnimatedCircle animatedProps={animatedProps} cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${length} ${length}`} rotation={-90} origin={`${size / 2}, ${size / 2}`}/></Svg>{children}</View>; }
export function Banner({ title, body }: {
    title: string;
    body: string;
}) { return <LinearGradient colors={['#7C5CFC', '#A18AFD']} style={{ borderRadius: 28, padding: 24, gap: 10 }}><Txt size={24} bold color="#fff">{title}</Txt><Txt color="#F0EAFF">{body}</Txt></LinearGradient>; }
