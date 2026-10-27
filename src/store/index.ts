import { create } from 'zustand';
import { openDatabase, save } from '../database';
import { bubble } from '../../modules/focus-bubble';
import type { Goal, Preferences, Session, Snapshot } from '../types';
import { defaults, elapsed, id, pause, resume, mergeNativeSession } from '../utils/domain';
type Patch = Partial<Snapshot> | ((state: Snapshot) => Partial<Snapshot>);
type State = Snapshot & {
    ready: boolean;
    error: string | null;
    init: () => Promise<void>;
    commit: (snapshot: Patch) => Promise<void>;
    upsertGoal: (goal: Goal) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    prefs: (p: Partial<Preferences>) => Promise<void>;
    start: (goalId: string, stepId: string | null, mode: Session['mode'], minutes: number, phase?: Session['phase']) => Promise<void>;
    toggle: () => Promise<void>;
    finish: () => Promise<void>;
    reconcile: () => Promise<void>;
};
let queue: Promise<unknown> = Promise.resolve();
export const useStore = create<State>((set, get) => ({
    goals: [], sessions: [], preferences: defaults, ready: false, error: null,
    init: async () => {
        try {
            const saved = await openDatabase();
            const raw = bubble?.consumeState();
            if (raw) {
                saved.sessions = mergeNativeSession(saved.sessions, JSON.parse(raw));
                await save(saved);
            }
            set({ ...saved, error: null });
            await get().reconcile();
            set({ ready: true });
        }
        catch (e) {
            set({ error: String(e), ready: true });
        }
    },
    commit: patch => {
        const operation = queue.then(async () => { const old = get(); const change = typeof patch === 'function' ? patch(old) : patch; const next = { goals: change.goals ?? old.goals, sessions: change.sessions ?? old.sessions, preferences: change.preferences ?? old.preferences }; await save(next); set({ ...next, error: null }); });
        queue = operation.catch(() => { });
        return operation;
    },
    upsertGoal: goal => get().commit(state => ({ goals: [goal, ...state.goals.filter(g => g.id !== goal.id)] })),
    deleteGoal: goalId => get().commit(state => {
        if (state.sessions.some(s => s.goalId === goalId && s.status !== 'completed'))
            throw Error('Finish your active session before deleting this goal.');
        return { goals: state.goals.filter(g => g.id !== goalId), sessions: state.sessions.filter(s => s.goalId !== goalId) };
    }),
    prefs: p => get().commit(state => ({ preferences: { ...state.preferences, ...p } })),
    start: (goalId, stepId, mode, minutes, phase: Session['phase'] = 'focus') => get().commit(state => {
        if (state.sessions.some(s => s.status !== 'completed'))
            throw Error('Finish the current session first.');
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal || (stepId && !goal.steps.some(s => s.id === stepId)))
            throw Error('Choose a goal and a valid step.');
        if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180)
            throw Error('Choose between 1 and 180 minutes.');
        const now = Date.now();
        const duration = minutes * 60;
        const session: Session = { id: id(), goalId, stepId, mode, plannedDuration: duration, actualDuration: 0, startedAt: now, anchorAt: now, endedAt: null, deadline: mode === 'stopwatch' ? null : now + duration * 1000, status: 'running', phase };
        return { sessions: [session, ...state.sessions] };
    }),
    toggle: () => get().commit(state => ({ sessions: state.sessions.map(s => s.status === 'running' ? pause(s) : s.status === 'paused' ? resume(s) : s) })),
    finish: () => get().commit(state => { const now = Date.now(); return { sessions: state.sessions.map(s => s.status === 'completed' ? s : { ...s, actualDuration: elapsed(s, now), endedAt: now, status: 'completed', deadline: null }) }; }),
    reconcile: async () => {
        const s = get().sessions.find(s => s.status === 'running');
        if (s && s.mode !== 'stopwatch' && elapsed(s) >= s.plannedDuration)
            await get().commit(state => ({ sessions: state.sessions.map(x => x.id !== s.id || x.status !== 'running' ? x : { ...x, actualDuration: x.plannedDuration, status: 'completed', endedAt: x.deadline ?? Date.now(), deadline: null }) }));
    },
}));
