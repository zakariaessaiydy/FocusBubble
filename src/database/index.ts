import * as SQLite from 'expo-sqlite';
import type { Snapshot } from '../types';
import { defaults } from '../utils/domain';
import { migration1 } from './schema';
let db: SQLite.SQLiteDatabase;
export async function openDatabase() {
    db = await SQLite.openDatabaseAsync('focusbubble.db');
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    const version = await db.getFirstAsync<{
        user_version: number;
    }>('PRAGMA user_version');
    if ((version?.user_version ?? 0) > 1)
        throw Error('This database needs a newer version of FocusBubble.');
    if (!version?.user_version)
        await db.withTransactionAsync(() => db.execAsync(migration1));
    const goals = await db.getAllAsync<{
        data: string;
    }>('SELECT data FROM goals');
    const sessions = await db.getAllAsync<{
        data: string;
    }>('SELECT data FROM sessions ORDER BY startedAt DESC');
    const pref = await db.getFirstAsync<{
        data: string;
    }>('SELECT data FROM preferences WHERE id=1');
    return { goals: goals.map(g => JSON.parse(g.data)), sessions: sessions.map(s => JSON.parse(s.data)), preferences: { ...defaults, ...(pref ? JSON.parse(pref.data) : {}) } } as Snapshot;
}
export async function save(snapshot: Snapshot) {
    await db.withTransactionAsync(async () => {
        await db.execAsync('DELETE FROM sessions; DELETE FROM steps; DELETE FROM goals;');
        for (const goal of snapshot.goals) {
            await db.runAsync('INSERT INTO goals VALUES(?,?)', goal.id, JSON.stringify(goal));
            for (const [position, step] of goal.steps.entries())
                await db.runAsync('INSERT INTO steps VALUES(?,?,?,?)', step.id, goal.id, position, JSON.stringify(step));
        }
        for (const session of snapshot.sessions)
            await db.runAsync('INSERT INTO sessions VALUES(?,?,?,?,?)', session.id, session.goalId, session.startedAt, session.status, JSON.stringify(session));
        await db.runAsync('INSERT OR REPLACE INTO preferences VALUES(1,?)', JSON.stringify(snapshot.preferences));
    });
}
