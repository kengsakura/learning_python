import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { title } = await req.json();
  const max = db().prepare("SELECT COALESCE(MAX(sort_order),0) AS m FROM problems").get() as { m: number };
  const r = db()
    .prepare("INSERT INTO problems (title, description, difficulty, starter_code, published, sort_order) VALUES (?,?,?,?,0,?)")
    .run(String(title || "โจทย์ใหม่"), "", "easy", "", max.m + 1);
  return NextResponse.json({ id: Number(r.lastInsertRowid) });
}
