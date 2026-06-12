import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { lessonId, answers } = await req.json();

  // ตรวจคำตอบฝั่งเซิร์ฟเวอร์ เพื่อไม่ให้เฉลยรั่วไปหน้าเว็บ
  const questions = await q<{ id: number; answer_index: number; explanation: string }>(
    "SELECT id, answer_index, explanation FROM quiz_questions WHERE lesson_id = ? ORDER BY id",
    [Number(lessonId)]
  );
  if (questions.length === 0) {
    return NextResponse.json({ error: "ไม่พบแบบทดสอบ" }, { status: 404 });
  }

  const results = questions.map((question) => {
    const chosen = Number(answers?.[question.id]);
    return {
      id: Number(question.id),
      correct: chosen === Number(question.answer_index),
      answerIndex: Number(question.answer_index),
      explanation: question.explanation,
    };
  });
  const score = results.filter((r) => r.correct).length;

  await q("INSERT INTO quiz_attempts (user_id, lesson_id, score, total) VALUES (?,?,?,?)", [
    s.userId,
    Number(lessonId),
    score,
    questions.length,
  ]);

  return NextResponse.json({ score, total: questions.length, results });
}
