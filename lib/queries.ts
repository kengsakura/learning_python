// Data-access layer — รวม query ที่หน้าเว็บใช้ไว้ที่เดียว
// ถ้าจะย้ายไป Supabase (production) ให้แก้ฟังก์ชันในไฟล์นี้กับ API routes เป็นหลัก
import { db } from "./db";

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

export function listLessons(includeUnpublished = false): Lesson[] {
  const where = includeUnpublished ? "" : "WHERE published = 1";
  return db().prepare(`SELECT * FROM lessons ${where} ORDER BY sort_order, id`).all() as Lesson[];
}

export function getLesson(id: number): Lesson | undefined {
  return db().prepare("SELECT * FROM lessons WHERE id = ?").get(id) as Lesson | undefined;
}

export function getQuestions(lessonId: number): Question[] {
  return db()
    .prepare("SELECT * FROM quiz_questions WHERE lesson_id = ? ORDER BY id")
    .all(lessonId) as Question[];
}

export function listProblems(includeUnpublished = false): Problem[] {
  const where = includeUnpublished ? "" : "WHERE published = 1";
  return db().prepare(`SELECT * FROM problems ${where} ORDER BY sort_order, id`).all() as Problem[];
}

export function getProblem(id: number): Problem | undefined {
  return db().prepare("SELECT * FROM problems WHERE id = ?").get(id) as Problem | undefined;
}

export function getTestCases(problemId: number): TestCase[] {
  return db()
    .prepare("SELECT * FROM test_cases WHERE problem_id = ? ORDER BY id")
    .all(problemId) as TestCase[];
}

export function getProgress(userId: number): Set<number> {
  const rows = db()
    .prepare("SELECT lesson_id FROM lesson_progress WHERE user_id = ?")
    .all(userId) as { lesson_id: number }[];
  return new Set(rows.map((r) => r.lesson_id));
}

export function getSolvedProblems(userId: number): Set<number> {
  const rows = db()
    .prepare("SELECT DISTINCT problem_id FROM submissions WHERE user_id = ? AND success = 1")
    .all(userId) as { problem_id: number }[];
  return new Set(rows.map((r) => r.problem_id));
}

export function getBestQuizScores(userId: number): Map<number, { score: number; total: number }> {
  const rows = db()
    .prepare(
      "SELECT lesson_id, MAX(score) AS score, total FROM quiz_attempts WHERE user_id = ? GROUP BY lesson_id"
    )
    .all(userId) as { lesson_id: number; score: number; total: number }[];
  return new Map(rows.map((r) => [r.lesson_id, { score: r.score, total: r.total }]));
}
