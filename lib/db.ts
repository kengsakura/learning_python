import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Data layer แบบเลือก backend อัตโนมัติ:
// - มี POSTGRES_URL (เช่นจาก Supabase integration บน Vercel) → ใช้ Postgres
// - ไม่มี → ใช้ SQLite ไฟล์ในเครื่อง (โหมด dev / รันเองในเครื่อง)
// SQL ทุกคำสั่งเขียนด้วย placeholder `?` แล้วถูกแปลงเป็น $1..$n ให้เองเมื่อใช้ Postgres

const PG_URL =
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  "";

const DB_DIR =
  process.env.DB_DIR ||
  (process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data"));
const SQLITE_PATH =
  process.env.DB_PATH ||
  path.join(DB_DIR, process.env.NODE_ENV === "production" ? "prod.db" : "dev.db");

type Row = Record<string, unknown>;

/* eslint-disable @typescript-eslint/no-explicit-any */
let pgSql: any = null;
let sqliteDb: any = null;
let initPromise: Promise<void> | null = null;

async function getPg() {
  if (!pgSql) {
    const postgres = (await import("postgres")).default;
    // prepare:false จำเป็นเมื่อต่อผ่าน pgbouncer (pooled URL ของ Supabase)
    pgSql = postgres(PG_URL, { prepare: false, max: 1 });
  }
  return pgSql;
}

async function getSqlite() {
  if (!sqliteDb) {
    const Database = (await import("better-sqlite3")).default;
    fs.mkdirSync(path.dirname(SQLITE_PATH), { recursive: true });
    sqliteDb = new Database(SQLITE_PATH);
    sqliteDb.pragma("journal_mode = WAL");
    sqliteDb.pragma("foreign_keys = ON");
  }
  return sqliteDb;
}

function toPgPlaceholders(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

async function rawQuery<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (PG_URL) {
    const pg = await getPg();
    return (await pg.unsafe(toPgPlaceholders(sql), params as never[])) as T[];
  }
  const d = await getSqlite();
  const stmt = d.prepare(sql);
  if (stmt.reader) return stmt.all(...params) as T[];
  stmt.run(...params);
  return [];
}

async function rawExec(ddl: string): Promise<void> {
  if (PG_URL) {
    const pg = await getPg();
    await pg.unsafe(ddl);
    return;
  }
  const d = await getSqlite();
  d.exec(ddl);
}

/** รัน query (สร้าง schema + seed ให้อัตโนมัติครั้งแรก) — ใช้ placeholder `?` */
export async function q<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!initPromise) initPromise = init();
  await initPromise;
  return rawQuery<T>(sql, params);
}

/** เหมือน q แต่คืนแถวแรกแถวเดียว (หรือ undefined) */
export async function qOne<T = Row>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await q<T>(sql, params);
  return rows[0];
}

async function init() {
  await migrate();
  await seed();
}

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    choices TEXT NOT NULL,
    answer_index INTEGER NOT NULL,
    explanation TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
    starter_code TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL DEFAULT '',
    expected_output TEXT NOT NULL DEFAULT '',
    hidden INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, lesson_id)
  );
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'code' CHECK (mode IN ('code','blocks')),
    passed INTEGER NOT NULL,
    total INTEGER NOT NULL,
    success INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// โครงสร้างเดียวกันในไวยากรณ์ Postgres — เก็บวันที่เป็น TEXT รูปแบบเดียวกับ SQLite
const PG_NOW = `to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS')`;
const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher')),
    created_at TEXT NOT NULL DEFAULT ${PG_NOW}
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    choices TEXT NOT NULL,
    answer_index INTEGER NOT NULL,
    explanation TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS problems (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
    starter_code TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS test_cases (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL DEFAULT '',
    expected_output TEXT NOT NULL DEFAULT '',
    hidden INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS lesson_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL DEFAULT ${PG_NOW},
    UNIQUE(user_id, lesson_id)
  );
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT ${PG_NOW}
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'code' CHECK (mode IN ('code','blocks')),
    passed INTEGER NOT NULL,
    total INTEGER NOT NULL,
    success INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${PG_NOW}
  );
`;

async function migrate() {
  await rawExec(PG_URL ? PG_SCHEMA : SQLITE_SCHEMA);
}

async function seed() {
  const users = await rawQuery<{ c: number }>("SELECT COUNT(*) AS c FROM users");
  if (Number(users[0]?.c) > 0) return;

  await rawQuery(
    "INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)",
    ["admin", bcrypt.hashSync("admin1234", 10), "ครูผู้ดูแล", "teacher"]
  );
  await rawQuery(
    "INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)",
    ["student", bcrypt.hashSync("student1234", 10), "นักเรียนทดลอง", "student"]
  );

  const lessons: { title: string; content: string; questions: [string, string[], number, string][] }[] = [
    {
      title: "รู้จัก Python และคำสั่ง print",
      content: `# รู้จัก Python และคำสั่ง print

Python เป็นภาษาโปรแกรมที่อ่านง่าย เหมาะกับผู้เริ่มต้น ใช้ได้ตั้งแต่งานคำนวณ เว็บ ไปจนถึง AI

## คำสั่ง print แสดงผลข้อความ

\`\`\`python
print("สวัสดี Python")
print("ผมชื่อ", "เพทาย")
print(1 + 2)
\`\`\`

ผลลัพธ์:

\`\`\`
สวัสดี Python
ผมชื่อ เพทาย
3
\`\`\`

## จุดสังเกต
- ข้อความ (string) ต้องอยู่ในเครื่องหมายคำพูด \`"..."\` หรือ \`'...'\`
- ตัวเลขไม่ต้องใส่เครื่องหมายคำพูด และคำนวณได้เลย
- \`print()\` ขึ้นบรรทัดใหม่ให้อัตโนมัติ

## คอมเมนต์ (comment)

ใช้ \`#\` เขียนหมายเหตุ โปรแกรมจะไม่ทำงานบรรทัดนั้น

\`\`\`python
# บรรทัดนี้คือคอมเมนต์
print("ทำงานเฉพาะบรรทัดนี้")
\`\`\`

ลองนำโค้ดไปรันในหน้า **โจทย์ฝึก** ได้เลย!`,
      questions: [
        ["คำสั่งใดใช้แสดงข้อความออกทางหน้าจอ?", ["show()", "print()", "echo()", "display()"], 1, "Python ใช้ print() ในการแสดงผล"],
        ["print(2 + 3) จะแสดงผลอะไร?", ["2 + 3", "5", "23", "เกิดข้อผิดพลาด"], 1, "ตัวเลขไม่อยู่ในเครื่องหมายคำพูด จึงถูกคำนวณก่อนแสดงผล"],
        ["สัญลักษณ์ใดใช้เขียนคอมเมนต์?", ["//", "<!--", "#", "%%"], 2, "Python ใช้ # นำหน้าคอมเมนต์"],
      ],
    },
    {
      title: "ตัวแปรและชนิดข้อมูล",
      content: `# ตัวแปรและชนิดข้อมูล

ตัวแปร (variable) คือชื่อที่ใช้เก็บค่า เช่น ตัวเลขหรือข้อความ

\`\`\`python
name = "มะลิ"
age = 14
height = 158.5
is_student = True
\`\`\`

## ชนิดข้อมูลพื้นฐาน

| ชนิด | ตัวอย่าง | ความหมาย |
|------|----------|----------|
| int | 14 | จำนวนเต็ม |
| float | 158.5 | ทศนิยม |
| str | "มะลิ" | ข้อความ |
| bool | True / False | ค่าจริง/เท็จ |

## การรับข้อมูลด้วย input

\`input()\` รับข้อมูลจากผู้ใช้ และได้ค่าเป็น **ข้อความ (str) เสมอ** ถ้าต้องการตัวเลขให้แปลงด้วย \`int()\` หรือ \`float()\`

\`\`\`python
name = input()
age = int(input())
print("สวัสดี", name, "อายุ", age, "ปี")
\`\`\`

## f-string จัดรูปแบบข้อความ

\`\`\`python
score = 95
print(f"คุณได้ {score} คะแนน")
\`\`\``,
      questions: [
        ["input() คืนค่าเป็นชนิดข้อมูลใดเสมอ?", ["int", "float", "str", "bool"], 2, "input() ได้ค่าเป็นข้อความ ต้องแปลงเองถ้าจะใช้เป็นตัวเลข"],
        ["ข้อใดเป็นการแปลงข้อความเป็นจำนวนเต็ม?", ["str(x)", "int(x)", "float(x)", "bool(x)"], 1, "int() แปลงเป็นจำนวนเต็ม"],
        ["x = 5 แล้ว type ของ x คืออะไร?", ["str", "float", "bool", "int"], 3, "5 เป็นจำนวนเต็ม (int)"],
        ['print(f"ได้ {2+3} คะแนน") แสดงอะไร?', ["ได้ {2+3} คะแนน", "ได้ 5 คะแนน", "ได้ 2+3 คะแนน", "เกิดข้อผิดพลาด"], 1, "f-string คำนวณนิพจน์ในวงเล็บปีกกาให้"],
      ],
    },
    {
      title: "เงื่อนไข if / elif / else",
      content: `# เงื่อนไข if / elif / else

ใช้ตัดสินใจว่าจะทำคำสั่งไหน ตามเงื่อนไขที่เป็นจริง

\`\`\`python
score = int(input())
if score >= 80:
    print("เกรด A")
elif score >= 70:
    print("เกรด B")
elif score >= 60:
    print("เกรด C")
else:
    print("ต้องพยายามอีกนิด")
\`\`\`

## ตัวดำเนินการเปรียบเทียบ

| สัญลักษณ์ | ความหมาย |
|-----------|----------|
| == | เท่ากับ |
| != | ไม่เท่ากับ |
| > , < | มากกว่า, น้อยกว่า |
| >= , <= | มากกว่าหรือเท่ากับ, น้อยกว่าหรือเท่ากับ |

## เชื่อมหลายเงื่อนไข

\`\`\`python
age = 15
if age >= 13 and age <= 19:
    print("เป็นวัยรุ่น")
\`\`\`

- \`and\` จริงทั้งคู่จึงจริง
- \`or\` จริงอย่างน้อยหนึ่งก็จริง
- \`not\` กลับค่าจริงเป็นเท็จ

> **สำคัญ:** บรรทัดในบล็อก if ต้องย่อหน้า (indent) เท่ากัน ปกติใช้ 4 เว้นวรรค`,
      questions: [
        ["สัญลักษณ์ใดใช้เปรียบเทียบว่า 'เท่ากับ'?", ["=", "==", "!=", "equals"], 1, "= ใช้กำหนดค่า ส่วน == ใช้เปรียบเทียบ"],
        ["x = 10 แล้ว x > 5 and x < 8 ได้ค่าอะไร?", ["True", "False", "10", "เกิดข้อผิดพลาด"], 1, "10 < 8 เป็นเท็จ and จึงได้ False"],
        ["ถ้าเงื่อนไข if เป็นเท็จ และมี else โปรแกรมจะทำอย่างไร?", ["หยุดทำงาน", "ทำบล็อก if อยู่ดี", "ทำบล็อก else", "ข้ามทั้งหมด"], 2, "else ทำงานเมื่อเงื่อนไขก่อนหน้าเป็นเท็จทั้งหมด"],
      ],
    },
    {
      title: "ลูป for และ while",
      content: `# ลูป for และ while

ลูป (loop) ใช้ทำคำสั่งซ้ำ ๆ โดยไม่ต้องเขียนหลายรอบ

## ลูป for กับ range

\`\`\`python
for i in range(5):
    print(i)        # 0 1 2 3 4

for i in range(1, 6):
    print(i)        # 1 2 3 4 5
\`\`\`

- \`range(n)\` นับ 0 ถึง n-1
- \`range(a, b)\` นับ a ถึง b-1
- \`range(a, b, step)\` นับทีละ step

## ลูป while

ทำซ้ำตราบใดที่เงื่อนไขเป็นจริง

\`\`\`python
n = 1
while n <= 5:
    print(n)
    n = n + 1
\`\`\`

## break และ continue

\`\`\`python
for i in range(10):
    if i == 5:
        break       # ออกจากลูปทันที
    if i % 2 == 0:
        continue    # ข้ามรอบนี้ไปรอบถัดไป
    print(i)        # 1 3
\`\`\`

## ตัวอย่าง: รวมเลข 1 ถึง n

\`\`\`python
n = int(input())
total = 0
for i in range(1, n + 1):
    total += i
print(total)
\`\`\``,
      questions: [
        ["range(3) ให้ค่าอะไรบ้าง?", ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3"], 1, "range(n) เริ่มที่ 0 ถึง n-1"],
        ["คำสั่งใดใช้ออกจากลูปทันที?", ["stop", "exit", "break", "continue"], 2, "break ออกจากลูป ส่วน continue ข้ามรอบ"],
        ["while ต่างจาก for อย่างไร?", ["ทำซ้ำตามเงื่อนไข", "ทำซ้ำตามจำนวนรอบเท่านั้น", "ใช้กับข้อความไม่ได้", "เร็วกว่าเสมอ"], 0, "while ทำซ้ำตราบใดที่เงื่อนไขยังจริง"],
      ],
    },
    {
      title: "ลิสต์ (List)",
      content: `# ลิสต์ (List)

ลิสต์เก็บข้อมูลหลายค่าไว้ในตัวแปรเดียว เรียงตามลำดับ

\`\`\`python
fruits = ["ส้ม", "กล้วย", "แอปเปิล"]
print(fruits[0])      # ส้ม (index เริ่มที่ 0)
print(len(fruits))    # 3
\`\`\`

## เพิ่ม/ลบสมาชิก

\`\`\`python
fruits.append("มะม่วง")   # เพิ่มท้ายลิสต์
fruits.remove("กล้วย")    # ลบค่าที่ระบุ
\`\`\`

## วนลูปอ่านลิสต์

\`\`\`python
scores = [80, 95, 60]
total = 0
for s in scores:
    total += s
print(total / len(scores))   # ค่าเฉลี่ย
\`\`\`

## ฟังก์ชันที่ใช้บ่อย

| ฟังก์ชัน | ความหมาย |
|----------|----------|
| len(lst) | จำนวนสมาชิก |
| sum(lst) | ผลรวม |
| max(lst), min(lst) | ค่ามาก/น้อยสุด |
| sorted(lst) | เรียงลำดับ |

## รับข้อมูลเป็นลิสต์

\`\`\`python
nums = input().split()            # ["3", "1", "2"]
nums = [int(x) for x in nums]     # [3, 1, 2]
print(max(nums))
\`\`\``,
      questions: [
        ['fruits = ["ส้ม", "กล้วย"] แล้ว fruits[1] คืออะไร?', ["ส้ม", "กล้วย", "1", "เกิดข้อผิดพลาด"], 1, "index เริ่มนับที่ 0 ดังนั้น [1] คือตัวที่สอง"],
        ["คำสั่งใดเพิ่มสมาชิกต่อท้ายลิสต์?", ["add()", "push()", "insert()", "append()"], 3, "append() เพิ่มต่อท้ายลิสต์"],
        ["sum([1, 2, 3]) ได้ค่าอะไร?", ["123", "6", "[6]", "3"], 1, "sum รวมค่าทุกตัวในลิสต์"],
      ],
    },
    {
      title: "ฟังก์ชัน (Function)",
      content: `# ฟังก์ชัน (Function)

ฟังก์ชันคือกลุ่มคำสั่งที่ตั้งชื่อไว้ เรียกใช้ซ้ำได้ ช่วยให้โค้ดเป็นระเบียบ

\`\`\`python
def greet(name):
    print(f"สวัสดี {name}")

greet("มะลิ")
greet("เพทาย")
\`\`\`

## คืนค่าด้วย return

\`\`\`python
def add(a, b):
    return a + b

result = add(3, 4)
print(result)   # 7
\`\`\`

## ค่าเริ่มต้นของพารามิเตอร์

\`\`\`python
def power(base, exp=2):
    return base ** exp

print(power(5))      # 25
print(power(2, 10))  # 1024
\`\`\`

## ตัวอย่าง: ตรวจเลขคู่

\`\`\`python
def is_even(n):
    return n % 2 == 0

x = int(input())
if is_even(x):
    print("เลขคู่")
else:
    print("เลขคี่")
\`\`\`

> ฟังก์ชันที่ไม่มี return จะคืนค่า \`None\``,
      questions: [
        ["คีย์เวิร์ดใดใช้ประกาศฟังก์ชัน?", ["function", "def", "fn", "func"], 1, "Python ใช้ def"],
        ["คำสั่งใดใช้ส่งค่ากลับจากฟังก์ชัน?", ["print", "give", "return", "send"], 2, "return ส่งค่ากลับไปยังผู้เรียก"],
        ["ฟังก์ชันที่ไม่มี return คืนค่าอะไร?", ["0", "ข้อความว่าง", "False", "None"], 3, "ไม่มี return จะได้ None"],
      ],
    },
  ];

  for (const [i, l] of lessons.entries()) {
    const inserted = await rawQuery<{ id: number }>(
      "INSERT INTO lessons (title, content, sort_order) VALUES (?,?,?) RETURNING id",
      [l.title, l.content, i + 1]
    );
    const lessonId = Number(inserted[0].id);
    for (const [question, choices, ans, exp] of l.questions) {
      await rawQuery(
        "INSERT INTO quiz_questions (lesson_id, question, choices, answer_index, explanation) VALUES (?,?,?,?,?)",
        [lessonId, question, JSON.stringify(choices), ans, exp]
      );
    }
  }

  const problems: {
    title: string; desc: string; diff: string; starter: string;
    tests: [string, string, number][];
  }[] = [
    {
      title: "ทักทายตามชื่อ",
      desc: `รับชื่อหนึ่งบรรทัด แล้วแสดงคำทักทาย

**Input:** ชื่อ 1 บรรทัด
**Output:** \`สวัสดี <ชื่อ>\`

### ตัวอย่าง
| Input | Output |
|-------|--------|
| มะลิ | สวัสดี มะลิ |`,
      diff: "easy",
      starter: `name = input()\n# เขียนต่อตรงนี้\n`,
      tests: [["มะลิ", "สวัสดี มะลิ", 0], ["Python", "สวัสดี Python", 0], ["ครูเพทาย", "สวัสดี ครูเพทาย", 1]],
    },
    {
      title: "บวกเลขสองจำนวน",
      desc: `รับจำนวนเต็ม 2 บรรทัด แล้วแสดงผลรวม

**Input:** จำนวนเต็ม a และ b บรรทัดละ 1 ค่า
**Output:** ผลรวม a + b

### ตัวอย่าง
Input:
\`\`\`
3
4
\`\`\`
Output:
\`\`\`
7
\`\`\``,
      diff: "easy",
      starter: `a = int(input())\nb = int(input())\n# เขียนต่อตรงนี้\n`,
      tests: [["3\n4", "7", 0], ["10\n-2", "8", 0], ["1000\n2345", "3345", 1]],
    },
    {
      title: "เลขคู่หรือเลขคี่",
      desc: `รับจำนวนเต็ม 1 ค่า ถ้าเป็นเลขคู่ให้แสดง \`even\` ถ้าเป็นเลขคี่ให้แสดง \`odd\`

**Input:** จำนวนเต็ม n
**Output:** \`even\` หรือ \`odd\`

### ตัวอย่าง
| Input | Output |
|-------|--------|
| 4 | even |
| 7 | odd |`,
      diff: "easy",
      starter: `n = int(input())\n# เขียนต่อตรงนี้\n`,
      tests: [["4", "even", 0], ["7", "odd", 0], ["0", "even", 1], ["-3", "odd", 1]],
    },
    {
      title: "ตัดเกรด",
      desc: `รับคะแนน 0–100 แล้วตัดเกรดตามเกณฑ์

| คะแนน | เกรด |
|-------|------|
| 80 ขึ้นไป | A |
| 70–79 | B |
| 60–69 | C |
| 50–59 | D |
| ต่ำกว่า 50 | F |

**Input:** จำนวนเต็ม 1 ค่า
**Output:** เกรด 1 ตัวอักษร`,
      diff: "medium",
      starter: `score = int(input())\n# เขียนต่อตรงนี้\n`,
      tests: [["85", "A", 0], ["72", "B", 0], ["65", "C", 1], ["50", "D", 1], ["49", "F", 1], ["80", "A", 1]],
    },
    {
      title: "ผลรวม 1 ถึง n",
      desc: `รับจำนวนเต็มบวก n แล้วแสดงผลรวม 1 + 2 + ... + n

**Input:** จำนวนเต็ม n (1 ≤ n ≤ 10000)
**Output:** ผลรวม

### ตัวอย่าง
| Input | Output |
|-------|--------|
| 5 | 15 |`,
      diff: "medium",
      starter: `n = int(input())\ntotal = 0\n# ใช้ลูป for ช่วยคำนวณ\n`,
      tests: [["5", "15", 0], ["1", "1", 0], ["100", "5050", 1], ["10000", "50005000", 1]],
    },
    {
      title: "ตาราง FizzBuzz",
      desc: `รับจำนวนเต็ม n แล้วแสดงเลข 1 ถึง n บรรทัดละค่า โดย
- ถ้าหารด้วย 3 และ 5 ลงตัว แสดง \`FizzBuzz\`
- ถ้าหารด้วย 3 ลงตัว แสดง \`Fizz\`
- ถ้าหารด้วย 5 ลงตัว แสดง \`Buzz\`
- นอกนั้นแสดงตัวเลขตามปกติ

### ตัวอย่าง (n = 5)
\`\`\`
1
2
Fizz
4
Buzz
\`\`\``,
      diff: "medium",
      starter: `n = int(input())\nfor i in range(1, n + 1):\n    pass  # เขียนเงื่อนไขตรงนี้\n`,
      tests: [["5", "1\n2\nFizz\n4\nBuzz", 0], ["15", "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", 1], ["3", "1\n2\nFizz", 1]],
    },
    {
      title: "ค่ามากที่สุดในลิสต์",
      desc: `รับจำนวนเต็มหลายค่าในบรรทัดเดียว (คั่นด้วยช่องว่าง) แล้วแสดงค่ามากที่สุด **โดยห้ามใช้ฟังก์ชัน max()**

**Input:** จำนวนเต็มคั่นด้วยช่องว่าง 1 บรรทัด
**Output:** ค่ามากที่สุด

### ตัวอย่าง
| Input | Output |
|-------|--------|
| 3 9 1 7 | 9 |

> เคล็ดลับ: \`nums = [int(x) for x in input().split()]\``,
      diff: "hard",
      starter: `nums = [int(x) for x in input().split()]\n# ห้ามใช้ max() — ลองวนลูปเปรียบเทียบเอง\n`,
      tests: [["3 9 1 7", "9", 0], ["-5 -2 -10", "-2", 0], ["42", "42", 1], ["1 2 3 100 99", "100", 1]],
    },
    {
      title: "นับสระภาษาอังกฤษ",
      desc: `รับข้อความภาษาอังกฤษ 1 บรรทัด แล้วนับว่ามีสระ (a, e, i, o, u — ทั้งตัวเล็กและตัวใหญ่) กี่ตัว

**Input:** ข้อความ 1 บรรทัด
**Output:** จำนวนสระ

### ตัวอย่าง
| Input | Output |
|-------|--------|
| Hello World | 3 |`,
      diff: "hard",
      starter: `text = input()\ncount = 0\n# เขียนต่อตรงนี้\n`,
      tests: [["Hello World", "3", 0], ["Python", "1", 0], ["AEIOU aeiou", "10", 1], ["xyz", "0", 1]],
    },
    {
      title: "เลขเฉพาะหรือไม่",
      desc: `รับจำนวนเต็ม n (n ≥ 2) ถ้า n เป็นจำนวนเฉพาะให้แสดง \`prime\` ไม่ใช่ให้แสดง \`not prime\`

จำนวนเฉพาะคือจำนวนที่หารลงตัวด้วย 1 และตัวมันเองเท่านั้น

**Input:** จำนวนเต็ม n
**Output:** \`prime\` หรือ \`not prime\`

### ตัวอย่าง
| Input | Output |
|-------|--------|
| 7 | prime |
| 9 | not prime |`,
      diff: "hard",
      starter: `n = int(input())\n# เขียนต่อตรงนี้\n`,
      tests: [["7", "prime", 0], ["9", "not prime", 0], ["2", "prime", 1], ["97", "prime", 1], ["100", "not prime", 1]],
    },
  ];

  for (const [i, p] of problems.entries()) {
    const inserted = await rawQuery<{ id: number }>(
      "INSERT INTO problems (title, description, difficulty, starter_code, sort_order) VALUES (?,?,?,?,?) RETURNING id",
      [p.title, p.desc, p.diff, p.starter, i + 1]
    );
    const problemId = Number(inserted[0].id);
    for (const [input, output, hidden] of p.tests) {
      await rawQuery(
        "INSERT INTO test_cases (problem_id, input, expected_output, hidden) VALUES (?,?,?,?)",
        [problemId, input, output, hidden]
      );
    }
  }
}
