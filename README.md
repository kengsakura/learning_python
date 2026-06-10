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

## โหมด dev / production

- **dev** (`npm run dev`) ใช้ `data/dev.db`
- **production** (`npm run build && npm start`) ใช้ `data/prod.db`
- ตั้งค่าผ่าน env ได้: `DB_PATH`, `AUTH_SECRET` (ดู `.env.example`)
- production จริงต้องตั้ง `AUTH_SECRET` เป็นค่าสุ่มยาว ๆ เสมอ

## นำขึ้น Vercel

⚠️ Vercel เป็น serverless — **เขียนไฟล์ SQLite ถาวรไม่ได้** จึงต้องย้ายฐานข้อมูลไป Supabase (หรือ Postgres อื่น) ก่อน deploy จริง

โค้ดถูกออกแบบให้ย้ายง่าย: query ทั้งหมดรวมอยู่ที่
- `lib/db.ts` (schema + seed)
- `lib/queries.ts` (data-access layer ของหน้าเว็บ)
- `app/api/**` (จุดเขียนข้อมูล)

แนวทางย้ายไป Supabase:
1. สร้างโปรเจกต์ Supabase แล้วรัน schema เดียวกัน (แก้ `INTEGER PRIMARY KEY AUTOINCREMENT` → `BIGSERIAL PRIMARY KEY`, `TEXT DEFAULT (datetime('now'))` → `TIMESTAMPTZ DEFAULT now()`)
2. เปลี่ยน `lib/db.ts` / `lib/queries.ts` ให้เรียกผ่าน `@supabase/supabase-js` หรือ `postgres` client
3. ตั้ง env บน Vercel: `AUTH_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
4. ส่วนการรันโค้ด Python ไม่ต้องแก้ — Pyodide รันในเบราว์เซอร์ของผู้ใช้อยู่แล้ว

## สถาปัตยกรรม

| ส่วน | เทคโนโลยี |
|------|-----------|
| เฟรมเวิร์ก | Next.js (App Router) + TypeScript + Tailwind CSS |
| ฐานข้อมูล | SQLite (better-sqlite3) — เปลี่ยนเป็น Supabase ได้ |
| ยืนยันตัวตน | JWT cookie (jose) + bcrypt |
| รันโค้ด Python | Pyodide ใน Web Worker (`public/py-worker.js`) |
| เขียนโค้ด | CodeMirror 6 (`@uiw/react-codemirror`) |
| บล็อกลากวาง | Blockly (renderer zelos, ภาษาไทย) |
| เนื้อหา | Markdown (react-markdown + remark-gfm) |

## หมายเหตุเรื่องการตรวจคำตอบ

- แบบทดสอบ (ควิซ): ตรวจฝั่งเซิร์ฟเวอร์ เฉลยไม่ถูกส่งไปหน้าเว็บ
- โจทย์โค้ด: ตรวจฝั่งเบราว์เซอร์ด้วย Pyodide แล้วบันทึกผลไปเซิร์ฟเวอร์ — นักเรียนที่เก่งเครื่องมือ dev อาจปลอมผลได้ ถ้าใช้แข่งจริงจังควรเพิ่มการตรวจซ้ำฝั่งเซิร์ฟเวอร์ (เช่น Judge0 หรือรัน Pyodide บน edge function)
