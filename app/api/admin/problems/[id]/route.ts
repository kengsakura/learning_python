import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { title, description, difficulty, starter_code, published, sort_order, testCases } = await req.json();

  const d = db();
  const tx = d.transaction(() => {
    d.prepare(
      "UPDATE problems SET title = ?, description = ?, difficulty = ?, starter_code = ?, published = ?, sort_order = ? WHERE id = ?"
    ).run(
      String(title),
      String(description),
      ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "easy",
      String(starter_code || ""),
      published ? 1 : 0,
      Number(sort_order) || 0,
      Number(id)
    );

    // แทนที่เทสเคสทั้งหมดของโจทย์นี้
    d.prepare("DELETE FROM test_cases WHERE problem_id = ?").run(Number(id));
    const ins = d.prepare(
      "INSERT INTO test_cases (problem_id, input, expected_output, hidden) VALUES (?,?,?,?)"
    );
    for (const t of testCases || []) {
      if (String(t.expected_output ?? "") === "" && String(t.input ?? "") === "") continue;
      ins.run(Number(id), String(t.input ?? ""), String(t.expected_output ?? ""), t.hidden ? 1 : 0);
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
  db().prepare("DELETE FROM problems WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
