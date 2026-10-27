import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
export type BubbleData = {
    id: string;
    title: string;
    emoji: string;
    color: string;
    step: string;
    mode: string;
    plannedDuration: number;
    actualDuration: number;
    anchorAt: number;
    status: string;
    size: number;
    opacity: number;
    doubleTap: boolean;
    haptics: boolean;
    reducedMotion: boolean;
};
type NativeBubble = {
    hasPermission: () => boolean;
    requestPermission: () => void;
    showBubble: (data: BubbleData) => Promise<void>;
    updateBubble: (data: BubbleData) => Promise<void>;
    hideBubble: () => Promise<void>;
    stop: () => Promise<void>;
    expandBubble: () => void;
    collapseBubble: () => void;
    resetPosition: () => void;
    getBubbleState: () => {
        visible: boolean;
        data: string | null;
    };
    consumeState: () => string | null;
    addListener: (event: string, listener: (data: {
        state: string;
    }) => void) => {
        remove: () => void;
    };
};
export const bubble = Platform.OS === 'android' ? requireOptionalNativeModule<NativeBubble>('FocusBubble') : null;
