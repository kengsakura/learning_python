import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getSession } from "@/lib/auth";

// บันทึกผลการส่งโจทย์ (โค้ดถูกรันและตรวจฝั่ง client ด้วย Pyodide)
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { problemId, code, mode, passed, total } = await req.json();
  const success = Number(passed) === Number(total) && Number(total) > 0 ? 1 : 0;
  await q(
    "INSERT INTO submissions (user_id, problem_id, code, mode, passed, total, success) VALUES (?,?,?,?,?,?,?)",
    [
      s.userId,
      Number(problemId),
      String(code ?? ""),
      mode === "blocks" ? "blocks" : "code",
      Number(passed),
      Number(total),
      success,
    ]
  );
  return NextResponse.json({ ok: true, success: success === 1 });
}
