import { NextResponse } from "next/server";
import { q, nowStr } from "@/lib/db";
import { getSession } from "@/lib/auth";

// บันทึกโค้ดที่เขียนค้างไว้ (autosave) — upsert ตาม (user, problem)
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { problemId, code, mode } = await req.json();
  await q(
    `INSERT INTO code_drafts (user_id, problem_id, code, mode, updated_at) VALUES (?,?,?,?,?)
     ON CONFLICT (user_id, problem_id) DO UPDATE SET code = excluded.code, mode = excluded.mode, updated_at = excluded.updated_at`,
    [s.userId, Number(problemId), String(code ?? ""), mode === "blocks" ? "blocks" : "code", nowStr()]
  );
  return NextResponse.json({ ok: true });
}
