export type Step = {
    id: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    deadline: string;
    completedAt: number | null;
    subtasks: {
        title: string;
        done: boolean;
    }[];
};
export type Goal = {
    id: string;
    title: string;
    description: string;
    motivation: string;
    type: 'short' | 'long';
    category: string;
    emoji: string;
    color: string;
    priority: number;
    startDate: number;
    targetDate: string;
    status: 'active' | 'archived';
    createdAt: number;
    updatedAt: number;
    steps: Step[];
};
export type Mode = 'countdown' | 'stopwatch' | 'pomodoro';
export type Session = {
    id: string;
    goalId: string;
    stepId: string | null;
    mode: Mode;
    plannedDuration: number;
    actualDuration: number;
    startedAt: number;
    endedAt: number | null;
    status: 'running' | 'paused' | 'completed';
    anchorAt: number;
    deadline: number | null;
    notificationId?: string;
    phase: 'focus' | 'break';
};
export type Preferences = {
    theme: 'light' | 'dark' | 'system';
    defaultFocusDuration: number;
    breakDuration: number;
    bubbleEnabled: boolean;
    bubbleSize: number;
    bubbleOpacity: number;
    doubleTap: boolean;
    hapticsEnabled: boolean;
    reducedMotion: boolean;
    notificationsEnabled: boolean;
    reminderHour: number;
    quietStart: number;
    quietEnd: number;
    onboardingDone: boolean;
    streaks: boolean;
    minimal: boolean;
};
export type Snapshot = {
    goals: Goal[];
    sessions: Session[];
    preferences: Preferences;
};
