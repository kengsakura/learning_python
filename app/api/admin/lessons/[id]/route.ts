import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { title, content, sort_order, published, questions } = await req.json();

  await q(
    "UPDATE lessons SET title = ?, content = ?, sort_order = ?, published = ? WHERE id = ?",
    [String(title), String(content), Number(sort_order) || 0, published ? 1 : 0, Number(id)]
  );

  // แทนที่ชุดคำถามทั้งหมดของบทเรียนนี้
  await q("DELETE FROM quiz_questions WHERE lesson_id = ?", [Number(id)]);
  for (const question of questions || []) {
    const choices = (question.choices || [])
      .map((c: unknown) => String(c))
      .filter((c: string) => c.trim() !== "");
    if (!question.question?.trim() || choices.length < 2) continue;
    await q(
      "INSERT INTO quiz_questions (lesson_id, question, choices, answer_index, explanation) VALUES (?,?,?,?,?)",
      [
        Number(id),
        String(question.question),
        JSON.stringify(choices),
        Math.min(Number(question.answer_index) || 0, choices.length - 1),
        String(question.explanation || ""),
      ]
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await q("DELETE FROM lessons WHERE id = ?", [Number(id)]);
  return NextResponse.json({ ok: true });
}
