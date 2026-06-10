import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { title } = await req.json();
  const max = db().prepare("SELECT COALESCE(MAX(sort_order),0) AS m FROM lessons").get() as { m: number };
  const r = db()
    .prepare("INSERT INTO lessons (title, content, sort_order, published) VALUES (?,?,?,0)")
    .run(String(title || "บทเรียนใหม่"), "", max.m + 1);
  return NextResponse.json({ id: Number(r.lastInsertRowid) });
}
