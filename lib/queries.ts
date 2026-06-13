// Data-access layer — รวม query ที่หน้าเว็บใช้ไว้ที่เดียว
// ทำงานได้ทั้ง SQLite (dev) และ Postgres/Supabase (production) ผ่าน q()/qOne() ใน lib/db.ts
import { q, qOne } from "./db";

export type Lesson = {
  id: number;
  title: string;
  content: string;
  sort_order: number;
  published: number;
};

export type Question = {
  id: number;
  lesson_id: number;
  question: string;
  choices: string;
  answer_index: number;
  explanation: string;
};

export type Problem = {
  id: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  starter_code: string;
  published: number;
  sort_order: number;
};

export type TestCase = {
  id: number;
  problem_id: number;
  input: string;
  expected_output: string;
  hidden: number;
};

export async function listLessons(includeUnpublished = false): Promise<Lesson[]> {
  const where = includeUnpublished ? "" : "WHERE published = 1";
  return q<Lesson>(`SELECT * FROM lessons ${where} ORDER BY sort_order, id`);
}

export async function getLesson(id: number): Promise<Lesson | undefined> {
  return qOne<Lesson>("SELECT * FROM lessons WHERE id = ?", [id]);
}

export async function getQuestions(lessonId: number): Promise<Question[]> {
  return q<Question>("SELECT * FROM quiz_questions WHERE lesson_id = ? ORDER BY id", [lessonId]);
}

export async function listProblems(includeUnpublished = false): Promise<Problem[]> {
  const where = includeUnpublished ? "" : "WHERE published = 1";
  return q<Problem>(`SELECT * FROM problems ${where} ORDER BY sort_order, id`);
}

export async function getProblem(id: number): Promise<Problem | undefined> {
  return qOne<Problem>("SELECT * FROM problems WHERE id = ?", [id]);
}

export async function getTestCases(problemId: number): Promise<TestCase[]> {
  return q<TestCase>("SELECT * FROM test_cases WHERE problem_id = ? ORDER BY id", [problemId]);
}

export async function getProgress(userId: number): Promise<Set<number>> {
  const rows = await q<{ lesson_id: number }>(
    "SELECT lesson_id FROM lesson_progress WHERE user_id = ?",
    [userId]
  );
  return new Set(rows.map((r) => Number(r.lesson_id)));
}

export async function getSolvedProblems(userId: number): Promise<Set<number>> {
  const rows = await q<{ problem_id: number }>(
    "SELECT DISTINCT problem_id FROM submissions WHERE user_id = ? AND success = 1",
    [userId]
  );
  return new Set(rows.map((r) => Number(r.problem_id)));
}

// สถานะโจทย์รายข้อของนักเรียน: solved = ผ่านแล้ว, attempted = ส่งแล้วแต่ยังไม่ผ่าน
export async function getProblemStatuses(
  userId: number
): Promise<Map<number, "solved" | "attempted">> {
  const rows = await q<{ problem_id: number; solved: number }>(
    "SELECT problem_id, MAX(success) AS solved FROM submissions WHERE user_id = ? GROUP BY problem_id",
    [userId]
  );
  const m = new Map<number, "solved" | "attempted">();
  for (const r of rows) {
    m.set(Number(r.problem_id), Number(r.solved) === 1 ? "solved" : "attempted");
  }
  return m;
}

// โค้ดที่นักเรียนเขียนค้างไว้ (autosave) ของโจทย์ข้อหนึ่ง
export async function getDraft(
  userId: number,
  problemId: number
): Promise<{ code: string; mode: string } | undefined> {
  return qOne<{ code: string; mode: string }>(
    "SELECT code, mode FROM code_drafts WHERE user_id = ? AND problem_id = ?",
    [userId, problemId]
  );
}

export async function getBestQuizScores(
  userId: number
): Promise<Map<number, { score: number; total: number }>> {
  const rows = await q<{ lesson_id: number; score: number; total: number }>(
    "SELECT lesson_id, MAX(score) AS score, total FROM quiz_attempts WHERE user_id = ? GROUP BY lesson_id, total",
    [userId]
  );
  return new Map(
    rows.map((r) => [Number(r.lesson_id), { score: Number(r.score), total: Number(r.total) }])
  );
}
