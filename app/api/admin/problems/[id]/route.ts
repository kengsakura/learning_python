import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { title, description, difficulty, starter_code, published, sort_order, testCases } =
    await req.json();

  await q(
    "UPDATE problems SET title = ?, description = ?, difficulty = ?, starter_code = ?, published = ?, sort_order = ? WHERE id = ?",
    [
      String(title),
      String(description),
      ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "easy",
      String(starter_code || ""),
      published ? 1 : 0,
      Number(sort_order) || 0,
      Number(id),
    ]
  );

  // แทนที่เทสเคสทั้งหมดของโจทย์นี้
  await q("DELETE FROM test_cases WHERE problem_id = ?", [Number(id)]);
  for (const t of testCases || []) {
    if (String(t.expected_output ?? "") === "" && String(t.input ?? "") === "") continue;
    await q(
      "INSERT INTO test_cases (problem_id, input, expected_output, hidden) VALUES (?,?,?,?)",
      [Number(id), String(t.input ?? ""), String(t.expected_output ?? ""), t.hidden ? 1 : 0]
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await q("DELETE FROM problems WHERE id = ?", [Number(id)]);
  return NextResponse.json({ ok: true });
}
