import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password, name } = await req.json();
  const u = String(username || "").trim();
  if (!u || !password || !name) {
    return NextResponse.json({ error: "กรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  if (u.length < 3 || String(password).length < 6) {
    return NextResponse.json(
      { error: "ชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร และรหัสผ่านอย่างน้อย 6 ตัวอักษร" },
      { status: 400 }
    );
  }
  const exists = db().prepare("SELECT id FROM users WHERE username = ?").get(u);
  if (exists) {
    return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" }, { status: 409 });
  }
  const r = db()
    .prepare("INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,'student')")
    .run(u, bcrypt.hashSync(String(password), 10), String(name).trim());
  await createSession({ userId: Number(r.lastInsertRowid), username: u, name: String(name).trim(), role: "student" });
  return NextResponse.json({ role: "student" });
}
