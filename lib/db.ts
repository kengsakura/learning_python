import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { LESSONS, SEED_VERSION } from "./seed-data";
import SEED_PROBLEMS from "./seed-problems.json";

// Data layer แบบเลือก backend อัตโนมัติ:
// - มี POSTGRES_URL (เช่นจาก Supabase integration บน Vercel) → ใช้ Postgres
// - ไม่มี → ใช้ SQLite ไฟล์ในเครื่อง (โหมด dev / รันเองในเครื่อง)
// SQL ทุกคำสั่งเขียนด้วย placeholder `?` แล้วถูกแปลงเป็น $1..$n ให้เองเมื่อใช้ Postgres

const PG_URL =
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  "";

const DB_DIR =
  process.env.DB_DIR ||
  (process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data"));
const SQLITE_PATH =
  process.env.DB_PATH ||
  path.join(DB_DIR, process.env.NODE_ENV === "production" ? "prod.db" : "dev.db");

type Row = Record<string, unknown>;

/* eslint-disable @typescript-eslint/no-explicit-any */
let pgSql: any = null;
let sqliteDb: any = null;
let initPromise: Promise<void> | null = null;

async function getPg() {
  if (!pgSql) {
    const postgres = (await import("postgres")).default;
    // prepare:false จำเป็นเมื่อต่อผ่าน pgbouncer (pooled URL ของ Supabase)
    pgSql = postgres(PG_URL, { prepare: false, max: 1 });
  }
  return pgSql;
}

async function getSqlite() {
  if (!sqliteDb) {
    const Database = (await import("better-sqlite3")).default;
    fs.mkdirSync(path.dirname(SQLITE_PATH), { recursive: true });
    sqliteDb = new Database(SQLITE_PATH);
    sqliteDb.pragma("journal_mode = WAL");
    sqliteDb.pragma("foreign_keys = ON");
  }
  return sqliteDb;
}

function toPgPlaceholders(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

async function rawQuery<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (PG_URL) {
    const pg = await getPg();
    return (await pg.unsafe(toPgPlaceholders(sql), params as never[])) as T[];
  }
  const d = await getSqlite();
  const stmt = d.prepare(sql);
  if (stmt.reader) return stmt.all(...params) as T[];
  stmt.run(...params);
  return [];
}

async function rawExec(ddl: string): Promise<void> {
  if (PG_URL) {
    const pg = await getPg();
    await pg.unsafe(ddl);
    return;
  }
  const d = await getSqlite();
  d.exec(ddl);
}

/** รัน query (สร้าง schema + sync เนื้อหาให้อัตโนมัติครั้งแรก) — ใช้ placeholder `?` */
export async function q<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!initPromise) initPromise = init();
  await initPromise;
  return rawQuery<T>(sql, params);
}

/** เหมือน q แต่คืนแถวแรกแถวเดียว (หรือ undefined) */
export async function qOne<T = Row>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await q<T>(sql, params);
  return rows[0];
}

async function init() {
  await migrate();
  await seedUsers();
  await syncContent();
}

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    choices TEXT NOT NULL,
    answer_index INTEGER NOT NULL,
    explanation TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
    starter_code TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL DEFAULT '',
    expected_output TEXT NOT NULL DEFAULT '',
    hidden INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, lesson_id)
  );
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'code' CHECK (mode IN ('code','blocks')),
    passed INTEGER NOT NULL,
    total INTEGER NOT NULL,
    success INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// โครงสร้างเดียวกันในไวยากรณ์ Postgres — เก็บวันที่เป็น TEXT รูปแบบเดียวกับ SQLite
const PG_NOW = `to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS')`;
const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher')),
    created_at TEXT NOT NULL DEFAULT ${PG_NOW}
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    choices TEXT NOT NULL,
    answer_index INTEGER NOT NULL,
    explanation TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS problems (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
    starter_code TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS test_cases (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL DEFAULT '',
    expected_output TEXT NOT NULL DEFAULT '',
    hidden INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS lesson_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL DEFAULT ${PG_NOW},
    UNIQUE(user_id, lesson_id)
  );
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT ${PG_NOW}
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'code' CHECK (mode IN ('code','blocks')),
    passed INTEGER NOT NULL,
    total INTEGER NOT NULL,
    success INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${PG_NOW}
  );
`;

async function migrate() {
  await rawExec(PG_URL ? PG_SCHEMA : SQLITE_SCHEMA);
}

async function seedUsers() {
  const users = await rawQuery<{ c: number }>("SELECT COUNT(*) AS c FROM users");
  if (Number(users[0]?.c) > 0) return;
  await rawQuery(
    "INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)",
    ["admin", bcrypt.hashSync("admin1234", 10), "ครูผู้ดูแล", "teacher"]
  );
  await rawQuery(
    "INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)",
    ["student", bcrypt.hashSync("student1234", 10), "นักเรียนทดลอง", "student"]
  );
}

async function bulkInsert(table: string, cols: string[], rows: unknown[][], chunkSize = 40) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => `(${cols.map(() => "?").join(",")})`).join(",");
    await rawQuery(
      `INSERT INTO ${table} (${cols.join(",")}) VALUES ${placeholders}`,
      chunk.flat()
    );
  }
}

// Sync เนื้อหาบทเรียน/โจทย์จาก seed เข้าฐานข้อมูล (รันเมื่อ SEED_VERSION เปลี่ยน)
// ใช้วิธี upsert ตามชื่อเรื่อง: เนื้อหาเดิมถูกอัปเดต ของใหม่ถูกเพิ่ม
// ไม่ลบแถวเดิม จึงไม่กระทบ progress / submissions ของนักเรียน
async function syncContent() {
  const v = await rawQuery<{ value: string }>("SELECT value FROM meta WHERE key = 'seed_version'");
  if (v[0]?.value === String(SEED_VERSION)) return;

  // ── บทเรียน ──
  const existingLessons = await rawQuery<{ id: number; title: string }>(
    "SELECT id, title FROM lessons"
  );
  const lessonByTitle = new Map(existingLessons.map((r) => [r.title, Number(r.id)]));
  const seedLessonIds: number[] = [];
  for (const [i, l] of LESSONS.entries()) {
    let id = lessonByTitle.get(l.title);
    if (id) {
      await rawQuery(
        "UPDATE lessons SET content = ?, sort_order = ?, published = 1 WHERE id = ?",
        [l.content, i + 1, id]
      );
    } else {
      const r = await rawQuery<{ id: number }>(
        "INSERT INTO lessons (title, content, sort_order) VALUES (?,?,?) RETURNING id",
        [l.title, l.content, i + 1]
      );
      id = Number(r[0].id);
    }
    seedLessonIds.push(id);
  }

  // คำถามควิซ: แทนที่ทั้งชุดของบทเรียนที่มาจาก seed (quiz_attempts อ้าง lesson ไม่อ้างคำถาม จึงปลอดภัย)
  await rawQuery(
    `DELETE FROM quiz_questions WHERE lesson_id IN (${seedLessonIds.map(() => "?").join(",")})`,
    seedLessonIds
  );
  const questionRows: unknown[][] = [];
  LESSONS.forEach((l, i) => {
    for (const [question, choices, answerIndex, explanation] of l.questions) {
      questionRows.push([seedLessonIds[i], question, JSON.stringify(choices), answerIndex, explanation]);
    }
  });
  await bulkInsert(
    "quiz_questions",
    ["lesson_id", "question", "choices", "answer_index", "explanation"],
    questionRows
  );

  // ── โจทย์ ──
  const existingProblems = await rawQuery<{ id: number; title: string }>(
    "SELECT id, title FROM problems"
  );
  const problemByTitle = new Map(existingProblems.map((r) => [r.title, Number(r.id)]));
  const seedProblemIds: number[] = [];
  const newProblems: { index: number; p: (typeof SEED_PROBLEMS)[number] }[] = [];
  for (const [i, p] of SEED_PROBLEMS.entries()) {
    const id = problemByTitle.get(p.title);
    if (id) {
      await rawQuery(
        "UPDATE problems SET description = ?, difficulty = ?, starter_code = ?, sort_order = ?, published = 1 WHERE id = ?",
        [p.description, p.difficulty, p.starter_code, i + 1, id]
      );
      seedProblemIds[i] = id;
    } else {
      newProblems.push({ index: i, p });
    }
  }
  for (const { index, p } of newProblems) {
    const r = await rawQuery<{ id: number }>(
      "INSERT INTO problems (title, description, difficulty, starter_code, sort_order) VALUES (?,?,?,?,?) RETURNING id",
      [p.title, p.description, p.difficulty, p.starter_code, index + 1]
    );
    seedProblemIds[index] = Number(r[0].id);
  }

  // เทสเคส: แทนที่ทั้งชุดของโจทย์ที่มาจาก seed
  await rawQuery(
    `DELETE FROM test_cases WHERE problem_id IN (${seedProblemIds.map(() => "?").join(",")})`,
    seedProblemIds
  );
  const testRows: unknown[][] = [];
  SEED_PROBLEMS.forEach((p, i) => {
    for (const t of p.tests) {
      testRows.push([seedProblemIds[i], t.input, t.expected_output, t.hidden]);
    }
  });
  await bulkInsert("test_cases", ["problem_id", "input", "expected_output", "hidden"], testRows);

  await rawQuery(
    "INSERT INTO meta (key, value) VALUES ('seed_version', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
    [String(SEED_VERSION)]
  );
}
