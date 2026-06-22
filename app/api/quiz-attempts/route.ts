import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { lessonId, answers } = await req.json();

  // แบบทดสอบทำได้ครั้งเดียว — ถ้าทำไปแล้วไม่ให้ส่งซ้ำ คืนคะแนนเดิม
  const existing = await q<{ score: number; total: number }>(
    "SELECT score, total FROM quiz_attempts WHERE user_id = ? AND lesson_id = ? ORDER BY id LIMIT 1",
    [s.userId, Number(lessonId)]
  );
  if (existing.length > 0) {
    return NextResponse.json(
      {
        error: "ทำแบบทดสอบนี้ไปแล้ว",
        locked: true,
        score: Number(existing[0].score),
        total: Number(existing[0].total),
      },
      { status: 409 }
    );
  }

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

  // ทำแบบทดสอบ = เรียนจบบทนั้นด้วย
  await q(
    "INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?,?) ON CONFLICT (user_id, lesson_id) DO NOTHING",
    [s.userId, Number(lessonId)]
  );

  return NextResponse.json({ score, total: questions.length, results });
}
