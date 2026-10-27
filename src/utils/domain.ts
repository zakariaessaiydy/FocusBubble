import type { Goal, Session } from '../types';
export const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
export const progress = (goal: Goal) => goal.steps.length ? goal.steps.filter(s => s.completedAt !== null).length / goal.steps.length : 0;
export function elapsed(session: Session, now = Date.now()): number {
    const delta = session.status === 'running' ? Math.max(0, now - session.anchorAt) / 1000 : 0;
    const value = Math.max(0, session.actualDuration + delta);
    return session.mode === 'stopwatch' ? value : Math.min(session.plannedDuration, value);
}
export function pause(session: Session, now = Date.now()): Session { return { ...session, actualDuration: elapsed(session, now), anchorAt: now, deadline: null, status: 'paused' }; }
export function resume(session: Session, now = Date.now()): Session { return { ...session, anchorAt: now, deadline: session.mode === 'stopwatch' ? null : now + (session.plannedDuration - session.actualDuration) * 1000, status: 'running' }; }
export const clock = (seconds: number) => { const s = Math.max(0, Math.ceil(seconds)); return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`; };
export const dayKey = (time: number) => new Date(time).toLocaleDateString('en-CA');
export function mergeNativeSession(sessions: Session[], value: {
    id: string;
    status: Session['status'];
    actualDuration: number;
    anchorAt: number;
}): Session[] {
    if (!value || !['running', 'paused', 'completed'].includes(value.status) || !Number.isFinite(value.actualDuration) || !Number.isFinite(value.anchorAt))
        return sessions;
    return sessions.map(s => {
        if (s.id !== value.id || s.status === 'completed')
            return s;
        const actualDuration = s.mode === 'stopwatch' ? Math.max(0, value.actualDuration) : Math.max(0, Math.min(s.plannedDuration, value.actualDuration));
        return { ...s, status: value.status, actualDuration, anchorAt: value.anchorAt, deadline: value.status === 'running' && s.mode !== 'stopwatch' ? value.anchorAt + (s.plannedDuration - actualDuration) * 1000 : null, endedAt: value.status === 'completed' ? value.anchorAt : null };
    });
}
export const defaults = { theme: 'light' as const, defaultFocusDuration: 25, breakDuration: 5, bubbleEnabled: false, bubbleSize: 68, bubbleOpacity: 1, doubleTap: true, hapticsEnabled: true, reducedMotion: false, notificationsEnabled: false, reminderHour: 10, quietStart: 22, quietEnd: 8, onboardingDone: false, streaks: false, minimal: false };
export function validateSnapshot(value: unknown): asserts value is import('../types').Snapshot {
    const v = value as import('../types').Snapshot;
    if (!v || !Array.isArray(v.goals) || !Array.isArray(v.sessions) || !v.preferences)
        throw Error('This is not a FocusBubble backup.');
    const ids = new Set<string>();
    for (const g of v.goals) {
        if (!g.id || ids.has(g.id) || typeof g.title !== 'string' || !g.title.trim() || !/^#[0-9a-f]{6}$/i.test(g.color) || !Array.isArray(g.steps) || !Number.isFinite(g.createdAt))
            throw Error('Invalid goal in backup.');
        ids.add(g.id);
        for (const s of g.steps)
            if (!s.id || typeof s.title !== 'string' || !Array.isArray(s.subtasks) || s.subtasks.some(sub => typeof sub.title !== 'string' || typeof sub.done !== 'boolean') || (s.completedAt !== null && !Number.isFinite(s.completedAt)))
                throw Error('Invalid roadmap in backup.');
    }
    for (const s of v.sessions)
        if (!ids.has(s.goalId) || !Number.isFinite(s.actualDuration) || s.actualDuration < 0 || !Number.isFinite(s.anchorAt) || !['running', 'paused', 'completed'].includes(s.status) || !['countdown', 'stopwatch', 'pomodoro'].includes(s.mode))
            throw Error('Invalid session in backup.');
    if (v.sessions.filter(s => s.status !== 'completed').length > 1)
        throw Error('Backup contains conflicting active sessions.');
    if (!Number.isFinite(v.preferences.defaultFocusDuration) || v.preferences.defaultFocusDuration < 1 || v.preferences.defaultFocusDuration > 180)
        throw Error('Invalid preferences.');
}
