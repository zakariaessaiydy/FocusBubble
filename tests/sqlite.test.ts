import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { migration1 } from '../src/database/schema.ts';
function database() { const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys=ON'); db.exec(migration1); return db; }
test('schema migrates idempotently and records its version', () => { const db = database(); db.exec(migration1); assert.equal(db.prepare('PRAGMA user_version').get()?.user_version, 1); assert.equal(db.prepare('SELECT count(*) AS n FROM migrations').get()?.n, 1); db.close(); });
test('goals can be created, edited and cascade-deleted with their roadmap and history', () => { const db = database(); db.prepare('INSERT INTO goals VALUES(?,?)').run('g', '{"title":"German"}'); db.prepare('UPDATE goals SET data=? WHERE id=?').run('{"title":"German B1"}', 'g'); assert.equal(JSON.parse(String(db.prepare('SELECT data FROM goals WHERE id=?').get('g')?.data)).title, 'German B1'); db.prepare('INSERT INTO steps VALUES(?,?,?,?)').run('step', 'g', 0, '{"completedAt":123}'); db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run('session', 'g', 123, 'paused', '{"actualDuration":60}'); assert.equal(JSON.parse(String(db.prepare('SELECT data FROM sessions').get()?.data)).actualDuration, 60); db.prepare('DELETE FROM goals WHERE id=?').run('g'); assert.equal(db.prepare('SELECT count(*) AS n FROM steps').get()?.n, 0); assert.equal(db.prepare('SELECT count(*) AS n FROM sessions').get()?.n, 0); db.close(); });
test('foreign keys reject orphan data and transaction rollback preserves existing goals', () => {
    const db = database();
    db.prepare('INSERT INTO goals VALUES(?,?)').run('saved', '{}');
    assert.throws(() => db.prepare('INSERT INTO steps VALUES(?,?,?,?)').run('orphan', 'missing', 0, '{}'));
    db.exec('BEGIN;DELETE FROM goals;');
    try {
        db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run('s', 'missing', 0, 'running', '{}');
    }
    catch {
        db.exec('ROLLBACK');
    }
    assert.equal(db.prepare('SELECT count(*) AS n FROM goals').get()?.n, 1);
    db.close();
});
