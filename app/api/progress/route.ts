import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { getSession } from "@/lib/auth";

// บันทึกว่าเรียนบทเรียนจบแล้ว
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { lessonId } = await req.json();
  await q(
    "INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?,?) ON CONFLICT (user_id, lesson_id) DO NOTHING",
    [s.userId, Number(lessonId)]
  );
  return NextResponse.json({ ok: true });
}
