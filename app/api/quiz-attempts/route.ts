import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { lessonId, answers } = await req.json();

  // ตรวจคำตอบฝั่งเซิร์ฟเวอร์ เพื่อไม่ให้เฉลยรั่วไปหน้าเว็บ
  const questions = db()
    .prepare("SELECT id, answer_index, explanation FROM quiz_questions WHERE lesson_id = ? ORDER BY id")
    .all(Number(lessonId)) as { id: number; answer_index: number; explanation: string }[];
  if (questions.length === 0) {
    return NextResponse.json({ error: "ไม่พบแบบทดสอบ" }, { status: 404 });
  }

  const results = questions.map((q) => {
    const chosen = Number(answers?.[q.id]);
    return { id: q.id, correct: chosen === q.answer_index, answerIndex: q.answer_index, explanation: q.explanation };
  });
  const score = results.filter((r) => r.correct).length;

  db()
    .prepare("INSERT INTO quiz_attempts (user_id, lesson_id, score, total) VALUES (?,?,?,?)")
    .run(s.userId, Number(lessonId), score, questions.length);

  return NextResponse.json({ score, total: questions.length, results });
}
