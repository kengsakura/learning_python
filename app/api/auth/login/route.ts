import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "กรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  const user = db()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(String(username).trim()) as
    | { id: number; username: string; password_hash: string; name: string; role: "student" | "teacher" }
    | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  await createSession({ userId: user.id, username: user.username, name: user.name, role: user.role });
  return NextResponse.json({ role: user.role });
}
