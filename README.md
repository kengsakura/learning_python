# 🐍 PyLearn — เว็บแอปเรียนภาษา Python

เว็บแอปสำหรับเรียน Python มีบทเรียนรายเรื่อง แบบทดสอบท้ายบท และโจทย์แข่งขันแบบมีเทสเคส
รองรับการเขียนคำตอบ 2 แบบ: **เขียนโค้ด** (CodeMirror) และ **ลากบล็อก** (Blockly)
ออกแบบให้ใช้ง่ายทั้งมือถือแนวตั้ง/แนวนอน และจอใหญ่

## ฟีเจอร์

### ฝั่งนักเรียน
- 📘 บทเรียนรายเรื่อง (Markdown) พร้อมแถบความคืบหน้า
- 📝 แบบทดสอบท้ายบท ตรวจคำตอบฝั่งเซิร์ฟเวอร์ (เฉลยไม่รั่วไปหน้าเว็บ) พร้อมคำอธิบายเฉลย
- 🏆 โจทย์เขียนโปรแกรมแบบแข่งขัน: มี input ให้ เขียนโค้ดให้ได้ output ตรงเทสเคส
  - ระดับความยาก ง่าย / ปานกลาง / ยาก
  - เทสเคสแบบเปิดเผย + แบบลับ
  - เขียนโค้ด Python จริง หรือ ต่อบล็อก Blockly (แปลงเป็น Python ให้อัตโนมัติ)
  - รันโค้ดในเบราว์เซอร์ด้วย **Pyodide** (WebAssembly) — ไม่ต้องมีเซิร์ฟเวอร์รันโค้ด ปลอดภัย ใช้บน Vercel ได้เลย
  - กันลูปไม่จบ: รันใน Web Worker มี timeout 15 วินาที
- สมัครสมาชิกนักเรียนได้เอง

### ฝั่งครู (admin)
- 📊 แดชบอร์ดภาพรวม + การส่งคำตอบล่าสุด
- จัดการบทเรียน + คำถามแบบทดสอบ (มี preview Markdown)
- จัดการโจทย์ + เทสเคส (ซ่อน/เปิดเผย, โค้ดตั้งต้น, ระดับความยาก, ฉบับร่าง/เผยแพร่)
- ดูความคืบหน้านักเรียนรายคน

## เริ่มใช้งาน (โหมด dev)

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — ระบบจะสร้างฐานข้อมูล SQLite (`data/dev.db`) พร้อมข้อมูลตัวอย่างให้อัตโนมัติ:

| บัญชี | username | password |
|-------|----------|----------|
| ครู (admin) | `admin` | `admin1234` |
| นักเรียนทดลอง | `student` | `student1234` |

ข้อมูลตัวอย่าง: บทเรียน 6 บท (print, ตัวแปร, if, ลูป, ลิสต์, ฟังก์ชัน) + โจทย์ 9 ข้อ 3 ระดับ

## ฐานข้อมูล: dev ใช้ SQLite / production ใช้ Supabase

ระบบเลือก backend อัตโนมัติจาก env (`lib/db.ts`):

| สภาพแวดล้อม | เงื่อนไข | ฐานข้อมูล |
|--------------|----------|-----------|
| dev ในเครื่อง | ไม่มี `POSTGRES_URL` | SQLite `data/dev.db` (สร้าง+seed อัตโนมัติ) |
| production ในเครื่อง | ไม่มี `POSTGRES_URL` | SQLite `data/prod.db` |
| Vercel | มี `POSTGRES_URL` จาก Supabase integration | Postgres บน Supabase (สร้างตาราง+seed อัตโนมัติครั้งแรก) |

- SQL ทุกคำสั่งเขียนครั้งเดียวด้วย placeholder `?` แล้วแปลงเป็น `$1..$n` ให้เองตอนใช้ Postgres
- ตั้งค่าเพิ่มเติม: `AUTH_SECRET` (จำเป็นใน production), `DB_PATH` (ดู `.env.example`)

## นำขึ้น Vercel

โปรเจกต์นี้ deploy อยู่บน Vercel + Supabase แล้ว ขั้นตอนถ้าทำใหม่:

1. `vercel` เชื่อมโปรเจกต์ (มี `vercel.json` บังคับ framework เป็น Next.js ให้แล้ว)
2. เพิ่ม **Supabase integration** จาก Vercel Marketplace (หรือ `vercel integration add supabase`) — จะได้ env `POSTGRES_URL` มาอัตโนมัติ
3. ตั้ง `AUTH_SECRET`: `openssl rand -hex 32 | vercel env add AUTH_SECRET production`
4. `vercel --prod` — เปิดใช้งานครั้งแรกระบบจะสร้างตารางและ seed ข้อมูลตัวอย่างให้เอง
5. ส่วนการรันโค้ด Python ไม่ต้องตั้งค่าอะไร — Pyodide รันในเบราว์เซอร์ของผู้ใช้

## สถาปัตยกรรม

| ส่วน | เทคโนโลยี |
|------|-----------|
| เฟรมเวิร์ก | Next.js (App Router) + TypeScript + Tailwind CSS |
| ฐานข้อมูล | SQLite (dev) / Postgres บน Supabase (production) — เลือกอัตโนมัติจาก env |
| ยืนยันตัวตน | JWT cookie (jose) + bcrypt |
| รันโค้ด Python | Pyodide ใน Web Worker (`public/py-worker.js`) |
| เขียนโค้ด | CodeMirror 6 (`@uiw/react-codemirror`) |
| บล็อกลากวาง | Blockly (renderer zelos, ภาษาไทย) |
| เนื้อหา | Markdown (react-markdown + remark-gfm) |

## หมายเหตุเรื่องการตรวจคำตอบ

- แบบทดสอบ (ควิซ): ตรวจฝั่งเซิร์ฟเวอร์ เฉลยไม่ถูกส่งไปหน้าเว็บ
- โจทย์โค้ด: ตรวจฝั่งเบราว์เซอร์ด้วย Pyodide แล้วบันทึกผลไปเซิร์ฟเวอร์ — นักเรียนที่เก่งเครื่องมือ dev อาจปลอมผลได้ ถ้าใช้แข่งจริงจังควรเพิ่มการตรวจซ้ำฝั่งเซิร์ฟเวอร์ (เช่น Judge0 หรือรัน Pyodide บน edge function)
