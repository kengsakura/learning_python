import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { title, content, sort_order, published, questions } = await req.json();

  const d = db();
  const tx = d.transaction(() => {
    d.prepare(
      "UPDATE lessons SET title = ?, content = ?, sort_order = ?, published = ? WHERE id = ?"
    ).run(String(title), String(content), Number(sort_order) || 0, published ? 1 : 0, Number(id));

    // แทนที่ชุดคำถามทั้งหมดของบทเรียนนี้
    d.prepare("DELETE FROM quiz_questions WHERE lesson_id = ?").run(Number(id));
    const ins = d.prepare(
      "INSERT INTO quiz_questions (lesson_id, question, choices, answer_index, explanation) VALUES (?,?,?,?,?)"
    );
    for (const q of questions || []) {
      const choices = (q.choices || []).map((c: unknown) => String(c)).filter((c: string) => c.trim() !== "");
      if (!q.question?.trim() || choices.length < 2) continue;
      ins.run(Number(id), String(q.question), JSON.stringify(choices), Math.min(Number(q.answer_index) || 0, choices.length - 1), String(q.explanation || ""));
    }
  });
  tx();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  db().prepare("DELETE FROM lessons WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
