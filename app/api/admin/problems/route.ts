import { NextResponse } from "next/server";
import { q, qOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await requireRole("teacher"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { title } = await req.json();
  const max = await qOne<{ m: number }>("SELECT COALESCE(MAX(sort_order),0) AS m FROM problems");
  const rows = await q<{ id: number }>(
    "INSERT INTO problems (title, description, difficulty, starter_code, published, sort_order) VALUES (?,?,?,?,0,?) RETURNING id",
    [String(title || "โจทย์ใหม่"), "", "easy", "", Number(max?.m || 0) + 1]
  );
  return NextResponse.json({ id: Number(rows[0].id) });
}
