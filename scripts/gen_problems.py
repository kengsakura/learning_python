# -*- coding: utf-8 -*-
"""สร้าง lib/seed-problems.json — โจทย์ 100 ข้อ (ง่าย 50 / ปานกลาง 30 / ยาก 20)
แต่ละข้อมีเฉลยจริง สคริปต์รันเฉลยกับ input เพื่อสร้าง expected output อัตโนมัติ
จึงมั่นใจได้ว่าเทสเคสถูกต้อง 100% — แก้โจทย์/เพิ่มโจทย์แล้วรันใหม่: python3 scripts/gen_problems.py
"""
import contextlib
import io
import json
import os
import sys

P = []


def prob(title, desc, diff, starter, sol, tests):
    P.append(dict(title=title, desc=desc, diff=diff, starter=starter, sol=sol, tests=tests))


V, H = 0, 1  # มองเห็น / ซ่อน

# ──────────────────────────────── ง่าย (50) ────────────────────────────────

prob("แสดงข้อความแรก", "แสดงข้อความ `Hello, Python!` ออกทางหน้าจอ (โจทย์ข้อนี้ไม่มี input)\n\n**Output:** `Hello, Python!` หนึ่งบรรทัด",
     "easy", "# พิมพ์ข้อความด้วย print\n",
     'print("Hello, Python!")',
     [("", V)])

prob("ทักทายตามชื่อ", "รับชื่อหนึ่งบรรทัด แล้วแสดงคำทักทาย\n\n**Input:** ชื่อ 1 บรรทัด\n**Output:** `สวัสดี <ชื่อ>`",
     "easy", "name = input()\n# เขียนต่อตรงนี้\n",
     'print("สวัสดี", input())',
     [("มะลิ", V), ("Python", V), ("ครูเพทาย", H)])

prob("บวกเลขสองจำนวน", "รับจำนวนเต็ม 2 บรรทัด แล้วแสดงผลรวม\n\n**Input:** จำนวนเต็ม a และ b บรรทัดละ 1 ค่า\n**Output:** ผลรวม a + b",
     "easy", "a = int(input())\nb = int(input())\n# เขียนต่อตรงนี้\n",
     "a=int(input());b=int(input());print(a+b)",
     [("3\n4", V), ("10\n-2", V), ("1000\n2345", H)])

prob("ลบเลขสองจำนวน", "รับจำนวนเต็ม a และ b แล้วแสดงผลลบ a - b\n\n**Input:** จำนวนเต็ม 2 บรรทัด\n**Output:** ผลลบ",
     "easy", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input());print(a-b)",
     [("10\n4", V), ("3\n8", V), ("-5\n-9", H)])

prob("คูณเลขสองจำนวน", "รับจำนวนเต็ม a และ b แล้วแสดงผลคูณ\n\n**Input:** จำนวนเต็ม 2 บรรทัด\n**Output:** ผลคูณ",
     "easy", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input());print(a*b)",
     [("6\n7", V), ("12\n0", V), ("-3\n9", H)])

prob("หารปัดเศษทิ้ง", "รับจำนวนเต็มบวก a และ b แล้วแสดงผลหารแบบปัดเศษทิ้ง (ใช้ `//`)\n\n**Input:** จำนวนเต็มบวก 2 บรรทัด\n**Output:** a // b",
     "easy", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input());print(a//b)",
     [("17\n5", V), ("20\n4", V), ("7\n10", H)])

prob("เศษจากการหาร", "รับจำนวนเต็มบวก a และ b แล้วแสดงเศษจากการหาร (ใช้ `%`)\n\n**Input:** จำนวนเต็มบวก 2 บรรทัด\n**Output:** a % b",
     "easy", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input());print(a%b)",
     [("17\n5", V), ("20\n4", V), ("9\n2", H)])

prob("ยกกำลัง", "รับฐาน a และเลขชี้กำลัง b แล้วแสดงค่า a ยกกำลัง b (ใช้ `**`)\n\n**Input:** จำนวนเต็ม 2 บรรทัด\n**Output:** a ** b",
     "easy", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input());print(a**b)",
     [("2\n10", V), ("5\n3", V), ("7\n0", H)])

prob("บวกเลขสามจำนวน", "รับจำนวนเต็ม 3 บรรทัด แล้วแสดงผลรวมทั้งหมด\n\n**Input:** จำนวนเต็ม 3 บรรทัด\n**Output:** ผลรวม",
     "easy", "",
     "print(int(input())+int(input())+int(input()))",
     [("1\n2\n3", V), ("10\n20\n30", V), ("-1\n-2\n3", H)])

prob("ค่าเฉลี่ยสองจำนวน", "รับจำนวนเต็ม a และ b แล้วแสดงค่าเฉลี่ย (a + b) / 2\n\n**Input:** จำนวนเต็ม 2 บรรทัด\n**Output:** ค่าเฉลี่ย (เป็นทศนิยม)",
     "easy", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input());print((a+b)/2)",
     [("7\n8", V), ("4\n4", V), ("1\n100", H)])

prob("พื้นที่สี่เหลี่ยมผืนผ้า", "รับความกว้างและความยาว (จำนวนเต็ม) แล้วแสดงพื้นที่\n\n**Input:** กว้าง และ ยาว บรรทัดละค่า\n**Output:** พื้นที่ (กว้าง × ยาว)",
     "easy", "w = int(input())\nh = int(input())\n",
     "w=int(input());h=int(input());print(w*h)",
     [("4\n5", V), ("10\n3", V), ("7\n7", H)])

prob("เส้นรอบรูปสี่เหลี่ยมผืนผ้า", "รับความกว้างและความยาว แล้วแสดงความยาวเส้นรอบรูป\n\n**Input:** กว้าง และ ยาว บรรทัดละค่า\n**Output:** เส้นรอบรูป 2 × (กว้าง + ยาว)",
     "easy", "w = int(input())\nh = int(input())\n",
     "w=int(input());h=int(input());print(2*(w+h))",
     [("4\n5", V), ("10\n3", V), ("1\n1", H)])

prob("พื้นที่สามเหลี่ยม", "รับความยาวฐานและความสูง (จำนวนเต็ม) แล้วแสดงพื้นที่ = ฐาน × สูง / 2\n\n**Input:** ฐาน และ สูง บรรทัดละค่า\n**Output:** พื้นที่ (เป็นทศนิยม)",
     "easy", "b = int(input())\nh = int(input())\n",
     "b=int(input());h=int(input());print(b*h/2)",
     [("10\n4", V), ("5\n3", V), ("7\n2", H)])

prob("เซลเซียสเป็นฟาเรนไฮต์", "รับอุณหภูมิเซลเซียส (จำนวนเต็ม) แล้วแปลงเป็นฟาเรนไฮต์ด้วยสูตร F = C × 9 / 5 + 32\n\n**Input:** จำนวนเต็ม 1 ค่า\n**Output:** อุณหภูมิฟาเรนไฮต์ (เป็นทศนิยม)",
     "easy", "c = int(input())\n",
     "c=int(input());print(c*9/5+32)",
     [("37", V), ("0", V), ("100", H), ("-40", H)])

prob("หลักหน่วย", "รับจำนวนเต็มบวก n แล้วแสดงเลขหลักหน่วยของ n (เคล็ดลับ: ใช้ `% 10`)\n\n**Input:** จำนวนเต็มบวก n\n**Output:** เลขหลักหน่วย",
     "easy", "n = int(input())\n",
     "print(int(input())%10)",
     [("123", V), ("70", V), ("9", H)])

prob("เลขคู่หรือเลขคี่", "รับจำนวนเต็ม 1 ค่า ถ้าเป็นเลขคู่ให้แสดง `even` ถ้าเป็นเลขคี่ให้แสดง `odd`\n\n**Input:** จำนวนเต็ม n\n**Output:** `even` หรือ `odd`",
     "easy", "n = int(input())\n# เขียนต่อตรงนี้\n",
     "n=int(input());print('even' if n%2==0 else 'odd')",
     [("4", V), ("7", V), ("0", H), ("-3", H)])

prob("บวก ลบ หรือศูนย์", "รับจำนวนเต็ม n ถ้ามากกว่า 0 แสดง `positive` น้อยกว่า 0 แสดง `negative` เท่ากับ 0 แสดง `zero`\n\n**Input:** จำนวนเต็ม n\n**Output:** `positive` / `negative` / `zero`",
     "easy", "n = int(input())\n",
     "n=int(input())\nif n>0: print('positive')\nelif n<0: print('negative')\nelse: print('zero')",
     [("5", V), ("-2", V), ("0", H)])

prob("ค่ามากสุดของสองจำนวน", "รับจำนวนเต็ม a และ b แล้วแสดงค่าที่มากกว่า\n\n**Input:** จำนวนเต็ม 2 บรรทัด\n**Output:** ค่าที่มากกว่า",
     "easy", "a = int(input())\nb = int(input())\n",
     "print(max(int(input()),int(input())))",
     [("3\n9", V), ("12\n5", V), ("-1\n-7", H)])

prob("ค่ามากสุดของสามจำนวน", "รับจำนวนเต็ม 3 บรรทัด แล้วแสดงค่าที่มากที่สุด\n\n**Input:** จำนวนเต็ม 3 บรรทัด\n**Output:** ค่ามากสุด",
     "easy", "",
     "print(max(int(input()),int(input()),int(input())))",
     [("3\n9\n5", V), ("1\n1\n1", V), ("-5\n-2\n-9", H)])

prob("ค่าสัมบูรณ์", "รับจำนวนเต็ม n แล้วแสดงค่าสัมบูรณ์ (ระยะห่างจากศูนย์)\n\n**Input:** จำนวนเต็ม n\n**Output:** |n|",
     "easy", "n = int(input())\n",
     "print(abs(int(input())))",
     [("-7", V), ("12", V), ("0", H)])

prob("สลับสองค่า", "รับจำนวนเต็ม a และ b แล้วแสดงผลสลับกัน: b ก่อนแล้วค่อย a บรรทัดละค่า\n\n**Input:** จำนวนเต็ม 2 บรรทัด\n**Output:** b และ a บรรทัดละค่า",
     "easy", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input());print(b);print(a)",
     [("1\n2", V), ("99\n-5", H)])

prob("เท่ากันหรือไม่", "รับจำนวนเต็ม a และ b ถ้าเท่ากันแสดง `equal` ไม่เท่ากันแสดง `not equal`\n\n**Input:** จำนวนเต็ม 2 บรรทัด\n**Output:** `equal` หรือ `not equal`",
     "easy", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input());print('equal' if a==b else 'not equal')",
     [("5\n5", V), ("3\n7", V), ("-1\n1", H)])

prob("หารด้วย 3 ลงตัวไหม", "รับจำนวนเต็ม n ถ้าหารด้วย 3 ลงตัวแสดง `yes` ไม่ลงตัวแสดง `no`\n\n**Input:** จำนวนเต็ม n\n**Output:** `yes` หรือ `no`",
     "easy", "n = int(input())\n",
     "print('yes' if int(input())%3==0 else 'no')",
     [("9", V), ("10", V), ("0", H), ("-6", H)])

prob("หารด้วยทั้ง 2 และ 3 ลงตัว", "รับจำนวนเต็ม n ถ้าหารด้วย 2 และ 3 ลงตัวทั้งคู่แสดง `yes` ไม่อย่างนั้นแสดง `no`\n\n**Input:** จำนวนเต็ม n\n**Output:** `yes` หรือ `no`",
     "easy", "n = int(input())\n",
     "n=int(input());print('yes' if n%2==0 and n%3==0 else 'no')",
     [("12", V), ("8", V), ("9", H), ("6", H)])

prob("ผ่านหรือตก", "รับคะแนนสอบ (0–100) ถ้าได้ 50 ขึ้นไปแสดง `pass` ต่ำกว่านั้นแสดง `fail`\n\n**Input:** จำนวนเต็ม 1 ค่า\n**Output:** `pass` หรือ `fail`",
     "easy", "score = int(input())\n",
     "print('pass' if int(input())>=50 else 'fail')",
     [("72", V), ("49", V), ("50", H)])

prob("ตรวจรหัสผ่าน", "รหัสผ่านที่ถูกต้องคือ `python123` รับรหัสผ่านหนึ่งบรรทัด ถ้าตรงแสดง `correct` ไม่ตรงแสดง `wrong`\n\n**Input:** ข้อความ 1 บรรทัด\n**Output:** `correct` หรือ `wrong`",
     "easy", "password = input()\n",
     "print('correct' if input()=='python123' else 'wrong')",
     [("python123", V), ("Python123", V), ("12345", H)])

prob("เลขสองหลักหรือไม่", "รับจำนวนเต็มบวก n ถ้า n เป็นเลขสองหลัก (10–99) แสดง `yes` ไม่ใช่แสดง `no`\n\n**Input:** จำนวนเต็มบวก n\n**Output:** `yes` หรือ `no`",
     "easy", "n = int(input())\n",
     "n=int(input());print('yes' if 10<=n<=99 else 'no')",
     [("45", V), ("7", V), ("100", H), ("10", H)])

prob("นับ 1 ถึง n", "รับจำนวนเต็มบวก n แล้วแสดงเลข 1 ถึง n บรรทัดละค่า\n\n**Input:** จำนวนเต็มบวก n\n**Output:** เลข 1 ถึง n บรรทัดละค่า",
     "easy", "n = int(input())\n# ใช้ for กับ range\n",
     "n=int(input())\nfor i in range(1,n+1): print(i)",
     [("5", V), ("1", V), ("10", H)])

prob("นับถอยหลัง", "รับจำนวนเต็มบวก n แล้วแสดงเลขจาก n ถอยหลังลงมาถึง 1 บรรทัดละค่า\n\n**Input:** จำนวนเต็มบวก n\n**Output:** n ถึง 1 บรรทัดละค่า",
     "easy", "n = int(input())\n",
     "n=int(input())\nfor i in range(n,0,-1): print(i)",
     [("5", V), ("3", V), ("1", H)])

prob("เลขคู่ถึง n", "รับจำนวนเต็มบวก n แล้วแสดงเลขคู่ทั้งหมดตั้งแต่ 2 ถึง n บรรทัดละค่า\n\n**Input:** จำนวนเต็มบวก n (n ≥ 2)\n**Output:** เลขคู่ 2, 4, 6, … ≤ n บรรทัดละค่า",
     "easy", "n = int(input())\n",
     "n=int(input())\nfor i in range(2,n+1,2): print(i)",
     [("10", V), ("7", V), ("2", H)])

prob("ดาว n ดวง", "รับจำนวนเต็มบวก n แล้วแสดงดาว `*` ติดกัน n ดวงในบรรทัดเดียว (เคล็ดลับ: `\"*\" * n`)\n\n**Input:** จำนวนเต็มบวก n\n**Output:** ดาว n ดวง",
     "easy", "n = int(input())\n",
     "print('*'*int(input()))",
     [("5", V), ("1", V), ("12", H)])

prob("สี่เหลี่ยมดาว", "รับจำนวนเต็มบวก n แล้วแสดงสี่เหลี่ยมดาวขนาด n × n\n\n**Input:** จำนวนเต็มบวก n\n**Output:** ดาว n ดวง จำนวน n บรรทัด",
     "easy", "n = int(input())\n",
     "n=int(input())\nfor _ in range(n): print('*'*n)",
     [("3", V), ("1", V), ("5", H)])

prob("สามเหลี่ยมดาว", "รับจำนวนเต็มบวก n แล้วแสดงสามเหลี่ยมดาว: แถวที่ 1 มีดาว 1 ดวง แถวที่ 2 มี 2 ดวง … จนถึงแถวที่ n\n\n**Input:** จำนวนเต็มบวก n\n**Output:** สามเหลี่ยมดาว n แถว",
     "easy", "n = int(input())\n",
     "n=int(input())\nfor i in range(1,n+1): print('*'*i)",
     [("4", V), ("1", V), ("6", H)])

prob("ความยาวข้อความ", "รับข้อความหนึ่งบรรทัด แล้วแสดงจำนวนตัวอักษร (รวมช่องว่าง)\n\n**Input:** ข้อความ 1 บรรทัด\n**Output:** ความยาวข้อความ",
     "easy", "text = input()\n",
     "print(len(input()))",
     [("hello", V), ("Python is fun", V), ("a", H)])

prob("ตัวพิมพ์ใหญ่ทั้งหมด", "รับข้อความภาษาอังกฤษ แล้วแสดงเป็นตัวพิมพ์ใหญ่ทั้งหมด\n\n**Input:** ข้อความ 1 บรรทัด\n**Output:** ข้อความตัวพิมพ์ใหญ่",
     "easy", "text = input()\n",
     "print(input().upper())",
     [("hello world", V), ("Python", V), ("aBcDe", H)])

prob("ตัวพิมพ์เล็กทั้งหมด", "รับข้อความภาษาอังกฤษ แล้วแสดงเป็นตัวพิมพ์เล็กทั้งหมด\n\n**Input:** ข้อความ 1 บรรทัด\n**Output:** ข้อความตัวพิมพ์เล็ก",
     "easy", "text = input()\n",
     "print(input().lower())",
     [("HELLO World", V), ("PyThOn", V), ("abc", H)])

prob("กลับข้อความ", "รับข้อความหนึ่งบรรทัด แล้วแสดงข้อความกลับด้าน (เคล็ดลับ: `text[::-1]`)\n\n**Input:** ข้อความ 1 บรรทัด\n**Output:** ข้อความกลับด้าน",
     "easy", "text = input()\n",
     "print(input()[::-1])",
     [("hello", V), ("Python", V), ("abc def", H)])

prob("อักษรตัวแรกและตัวสุดท้าย", "รับข้อความ (ยาวอย่างน้อย 1 ตัวอักษร) แสดงอักษรตัวแรกบรรทัดหนึ่ง และอักษรตัวสุดท้ายอีกบรรทัด\n\n**Input:** ข้อความ 1 บรรทัด\n**Output:** ตัวแรก และ ตัวสุดท้าย บรรทัดละตัว",
     "easy", "text = input()\n",
     "s=input();print(s[0]);print(s[-1])",
     [("python", V), ("a", V), ("Hello!", H)])

prob("ต่อข้อความ", "รับข้อความ 2 บรรทัด แล้วแสดงข้อความทั้งสองต่อกันในบรรทัดเดียว คั่นด้วยช่องว่าง 1 ช่อง\n\n**Input:** ข้อความ 2 บรรทัด\n**Output:** ข้อความที่ต่อกัน",
     "easy", "a = input()\nb = input()\n",
     "print(input(),input())",
     [("good\nmorning", V), ("สวัสดี\nครับ", H)])

prob("ทำซ้ำข้อความ", "รับข้อความ 1 บรรทัด และจำนวนเต็มบวก n แล้วแสดงข้อความนั้นซ้ำ n บรรทัด\n\n**Input:** ข้อความ และ n บรรทัดละค่า\n**Output:** ข้อความซ้ำ n บรรทัด",
     "easy", "text = input()\nn = int(input())\n",
     "s=input();n=int(input())\nfor _ in range(n): print(s)",
     [("hi\n3", V), ("Python\n1", H), ("ok\n5", H)])

prob("นับตัวอักษร a", "รับข้อความภาษาอังกฤษ แล้วนับว่ามีตัวอักษร `a` (ตัวเล็กเท่านั้น) กี่ตัว\n\n**Input:** ข้อความ 1 บรรทัด\n**Output:** จำนวนตัว a",
     "easy", "text = input()\n",
     "print(input().count('a'))",
     [("banana", V), ("Apple and ant", V), ("xyz", H)])

prob("ขึ้นต้นด้วยคำนี้ไหม", "รับข้อความ 1 บรรทัด และคำขึ้นต้น 1 บรรทัด ถ้าข้อความขึ้นต้นด้วยคำนั้นแสดง `yes` ไม่ใช่แสดง `no`\n\n**Input:** ข้อความ และ คำขึ้นต้น บรรทัดละค่า\n**Output:** `yes` หรือ `no`",
     "easy", "text = input()\nprefix = input()\n",
     "print('yes' if input().startswith(input()) else 'no')",
     [("python is fun\npy", V), ("hello world\nworld", V), ("apple\napple", H)])

prob("มีคำนี้ในประโยคไหม", "รับประโยค 1 บรรทัด และคำค้นหา 1 บรรทัด ถ้าพบคำนั้นในประโยคแสดง `found` ไม่พบแสดง `not found`\n\n**Input:** ประโยค และ คำค้นหา บรรทัดละค่า\n**Output:** `found` หรือ `not found`",
     "easy", "sentence = input()\nword = input()\n",
     "s=input();w=input();print('found' if w in s else 'not found')",
     [("I love Python\nlove", V), ("hello world\ncat", V), ("ขอบคุณครับ\nคุณ", H)])

prob("ผลรวมของลิสต์", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว (คั่นด้วยช่องว่าง) แล้วแสดงผลรวม\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง 1 บรรทัด\n**Output:** ผลรวม\n\n> เคล็ดลับ: `nums = [int(x) for x in input().split()]`",
     "easy", "nums = [int(x) for x in input().split()]\n",
     "print(sum(int(x) for x in input().split()))",
     [("1 2 3 4", V), ("10 -5 3", V), ("42", H)])

prob("ค่ามากสุดในลิสต์ (ใช้ max ได้)", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วแสดงค่าที่มากที่สุด (ข้อนี้ใช้ `max()` ได้)\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่ามากสุด",
     "easy", "nums = [int(x) for x in input().split()]\n",
     "print(max(int(x) for x in input().split()))",
     [("3 9 1 7", V), ("-5 -2 -10", V), ("8", H)])

prob("ค่าน้อยสุดในลิสต์", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วแสดงค่าที่น้อยที่สุด\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่าน้อยสุด",
     "easy", "nums = [int(x) for x in input().split()]\n",
     "print(min(int(x) for x in input().split()))",
     [("3 9 1 7", V), ("-5 -2 -10", V), ("8", H)])

prob("นับจำนวนสมาชิก", "รับค่าหลายค่าในบรรทัดเดียว (คั่นด้วยช่องว่าง) แล้วแสดงจำนวนสมาชิก\n\n**Input:** ค่าคั่นด้วยช่องว่าง 1 บรรทัด\n**Output:** จำนวนสมาชิก",
     "easy", "items = input().split()\n",
     "print(len(input().split()))",
     [("a b c d", V), ("1 2 3", V), ("hello", H)])

prob("สมาชิกตัวแรกและตัวสุดท้าย", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แสดงสมาชิกตัวแรกบรรทัดหนึ่ง และตัวสุดท้ายอีกบรรทัด\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ตัวแรก และ ตัวสุดท้าย บรรทัดละค่า",
     "easy", "nums = input().split()\n",
     "a=input().split();print(a[0]);print(a[-1])",
     [("5 8 2 9", V), ("7", V), ("1 2 3", H)])

prob("ปัดเศษทศนิยม", "รับเลขทศนิยม 1 ค่า แล้วแสดงค่าที่ปัดเศษเป็นจำนวนเต็มที่ใกล้ที่สุด (ใช้ `round()`)\n\n**Input:** เลขทศนิยม 1 ค่า\n**Output:** จำนวนเต็มหลังปัดเศษ",
     "easy", "x = float(input())\n",
     "print(round(float(input())))",
     [("3.7", V), ("6.2", V), ("9.9", H), ("2.4", H)])

prob("นาทีเป็นชั่วโมงกับนาที", "รับจำนวนนาที (จำนวนเต็มบวก) แล้วแปลงเป็นชั่วโมงกับนาทีที่เหลือ แสดงบรรทัดละค่า\n\n**Input:** จำนวนนาที\n**Output:** ชั่วโมง และ นาทีที่เหลือ บรรทัดละค่า",
     "easy", "m = int(input())\n",
     "m=int(input());print(m//60);print(m%60)",
     [("130", V), ("59", V), ("3600", H)])

# ──────────────────────────────── ปานกลาง (30) ────────────────────────────────

prob("ตัดเกรด", "รับคะแนน 0–100 แล้วตัดเกรดตามเกณฑ์\n\n| คะแนน | เกรด |\n|-------|------|\n| 80 ขึ้นไป | A |\n| 70–79 | B |\n| 60–69 | C |\n| 50–59 | D |\n| ต่ำกว่า 50 | F |\n\n**Input:** จำนวนเต็ม 1 ค่า\n**Output:** เกรด 1 ตัวอักษร",
     "medium", "score = int(input())\n# เขียนต่อตรงนี้\n",
     "s=int(input())\nif s>=80: print('A')\nelif s>=70: print('B')\nelif s>=60: print('C')\nelif s>=50: print('D')\nelse: print('F')",
     [("85", V), ("72", V), ("65", H), ("50", H), ("49", H), ("80", H)])

prob("ผลรวม 1 ถึง n", "รับจำนวนเต็มบวก n แล้วแสดงผลรวม 1 + 2 + ... + n\n\n**Input:** จำนวนเต็ม n (1 ≤ n ≤ 10000)\n**Output:** ผลรวม",
     "medium", "n = int(input())\ntotal = 0\n# ใช้ลูป for ช่วยคำนวณ\n",
     "n=int(input());print(sum(range(1,n+1)))",
     [("5", V), ("1", V), ("100", H), ("10000", H)])

prob("ตาราง FizzBuzz", "รับจำนวนเต็ม n แล้วแสดงเลข 1 ถึง n บรรทัดละค่า โดย\n- ถ้าหารด้วย 3 และ 5 ลงตัว แสดง `FizzBuzz`\n- ถ้าหารด้วย 3 ลงตัว แสดง `Fizz`\n- ถ้าหารด้วย 5 ลงตัว แสดง `Buzz`\n- นอกนั้นแสดงตัวเลขตามปกติ\n\n**Input:** จำนวนเต็มบวก n\n**Output:** ผลลัพธ์ n บรรทัด",
     "medium", "n = int(input())\nfor i in range(1, n + 1):\n    pass  # เขียนเงื่อนไขตรงนี้\n",
     "n=int(input())\nfor i in range(1,n+1):\n    if i%15==0: print('FizzBuzz')\n    elif i%3==0: print('Fizz')\n    elif i%5==0: print('Buzz')\n    else: print(i)",
     [("5", V), ("15", H), ("3", H)])

prob("ผลรวมเลขคู่", "รับจำนวนเต็มบวก n แล้วแสดงผลรวมของเลขคู่ทั้งหมดตั้งแต่ 2 ถึง n\n\n**Input:** จำนวนเต็มบวก n\n**Output:** ผลรวมเลขคู่",
     "medium", "n = int(input())\n",
     "n=int(input());print(sum(range(2,n+1,2)))",
     [("10", V), ("7", V), ("100", H), ("1", H)])

prob("แฟกทอเรียล", "รับจำนวนเต็ม n (0 ≤ n ≤ 20) แล้วแสดงค่า n! = 1 × 2 × … × n (กำหนด 0! = 1)\n\n**Input:** จำนวนเต็ม n\n**Output:** n!",
     "medium", "n = int(input())\nresult = 1\n",
     "n=int(input())\nr=1\nfor i in range(2,n+1): r*=i\nprint(r)",
     [("5", V), ("0", V), ("10", H), ("20", H)])

prob("สูตรคูณ", "รับจำนวนเต็มบวก n แล้วแสดงสูตรคูณแม่ n ตั้งแต่ 1 ถึง 12 ในรูปแบบ `n x i = ผลลัพธ์`\n\n**Input:** จำนวนเต็มบวก n\n**Output:** สูตรคูณ 12 บรรทัด เช่น `2 x 1 = 2`",
     "medium", "n = int(input())\n",
     "n=int(input())\nfor i in range(1,13): print(f'{n} x {i} = {n*i}')",
     [("2", V), ("7", H), ("12", H)])

prob("นับเลขคี่ในลิสต์", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วนับว่ามีเลขคี่กี่ตัว\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** จำนวนเลขคี่",
     "medium", "nums = [int(x) for x in input().split()]\n",
     "print(sum(1 for x in input().split() if int(x)%2!=0))",
     [("1 2 3 4 5", V), ("2 4 6", V), ("-1 -3 0", H)])

prob("ค่าเฉลี่ยทศนิยม 2 ตำแหน่ง", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วแสดงค่าเฉลี่ยเป็นทศนิยม 2 ตำแหน่ง (ใช้ f-string `{x:.2f}`)\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่าเฉลี่ยทศนิยม 2 ตำแหน่ง",
     "medium", "nums = [int(x) for x in input().split()]\n",
     "a=[int(x) for x in input().split()];print(f'{sum(a)/len(a):.2f}')",
     [("80 95 60", V), ("1 2", V), ("10", H), ("1 2 3 4 5 6", H)])

prob("กลับตัวเลข", "รับจำนวนเต็มบวก n แล้วแสดงตัวเลขที่กลับหลักจากหลังไปหน้า (เช่น 123 → 321, 120 → 21)\n\n**Input:** จำนวนเต็มบวก n\n**Output:** ตัวเลขกลับด้าน (ไม่มีศูนย์นำหน้า)",
     "medium", "n = input()\n",
     "print(int(input()[::-1]))",
     [("123", V), ("120", V), ("5", H), ("9000", H)])

prob("ผลรวมของหลัก", "รับจำนวนเต็มบวก n แล้วแสดงผลรวมของเลขแต่ละหลัก (เช่น 123 → 1+2+3 = 6)\n\n**Input:** จำนวนเต็มบวก n\n**Output:** ผลรวมของหลัก",
     "medium", "n = input()\n",
     "print(sum(int(d) for d in input()))",
     [("123", V), ("999", V), ("5", H), ("100000", H)])

prob("นับจำนวนหลัก", "รับจำนวนเต็มบวก n แล้วแสดงว่า n มีกี่หลัก\n\n**Input:** จำนวนเต็มบวก n\n**Output:** จำนวนหลัก",
     "medium", "n = input()\n",
     "print(len(input()))",
     [("12345", V), ("7", V), ("1000000", H)])

prob("ปีอธิกสุรทิน", "รับปี ค.ศ. ถ้าเป็นปีอธิกสุรทินแสดง `leap` ไม่ใช่แสดง `not leap`\n\nกติกา: หาร 4 ลงตัว **และ** (หาร 100 ไม่ลงตัว **หรือ** หาร 400 ลงตัว)\n\n**Input:** ปี ค.ศ. (จำนวนเต็มบวก)\n**Output:** `leap` หรือ `not leap`",
     "medium", "year = int(input())\n",
     "y=int(input());print('leap' if y%4==0 and (y%100!=0 or y%400==0) else 'not leap')",
     [("2024", V), ("2023", V), ("1900", H), ("2000", H)])

prob("คำพาลินโดรม", "รับคำภาษาอังกฤษ (ตัวพิมพ์เล็ก) ถ้าอ่านจากหน้าไปหลังกับหลังมาหน้าได้เหมือนกันแสดง `yes` ไม่ใช่แสดง `no`\n\n**Input:** คำ 1 บรรทัด\n**Output:** `yes` หรือ `no`",
     "medium", "word = input()\n",
     "w=input();print('yes' if w==w[::-1] else 'no')",
     [("level", V), ("python", V), ("a", H), ("noon", H)])

prob("หาตำแหน่งในลิสต์", "รับจำนวนเต็มหลายค่าในบรรทัดแรก และค่าที่ต้องการหาในบรรทัดที่สอง แสดงตำแหน่ง (index เริ่มที่ 0) ของค่านั้นที่พบครั้งแรก ถ้าไม่พบแสดง `-1`\n\n**Input:** ลิสต์ 1 บรรทัด และค่าที่หา 1 บรรทัด\n**Output:** index หรือ -1",
     "medium", "nums = [int(x) for x in input().split()]\ntarget = int(input())\n",
     "a=[int(x) for x in input().split()];t=int(input());print(a.index(t) if t in a else -1)",
     [("5 8 2 9\n2", V), ("1 2 3\n7", V), ("4 4 4\n4", H)])

prob("เรียงจากน้อยไปมาก", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วแสดงค่าทั้งหมดเรียงจากน้อยไปมาก คั่นด้วยช่องว่าง\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่าที่เรียงแล้ว คั่นด้วยช่องว่าง",
     "medium", "nums = [int(x) for x in input().split()]\n",
     "print(*sorted(int(x) for x in input().split()))",
     [("3 1 4 1 5", V), ("10 -5 0", V), ("7", H)])

prob("เรียงจากมากไปน้อย", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วแสดงค่าทั้งหมดเรียงจากมากไปน้อย คั่นด้วยช่องว่าง\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่าที่เรียงแล้ว คั่นด้วยช่องว่าง",
     "medium", "nums = [int(x) for x in input().split()]\n",
     "print(*sorted((int(x) for x in input().split()), reverse=True))",
     [("3 1 4 1 5", V), ("-2 8 0", V), ("9", H)])

prob("ตัดค่าซ้ำ", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วแสดงค่าที่ไม่ซ้ำกันโดย**รักษาลำดับการพบครั้งแรก** คั่นด้วยช่องว่าง\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่าที่ไม่ซ้ำตามลำดับ",
     "medium", "nums = [int(x) for x in input().split()]\n",
     "a=input().split()\nseen=[]\nfor x in a:\n    if x not in seen: seen.append(x)\nprint(*seen)",
     [("1 2 2 3 1 4", V), ("5 5 5", V), ("1 2 3", H)])

prob("นับคำในประโยค", "รับประโยคภาษาอังกฤษ 1 บรรทัด แล้วนับจำนวนคำ (คั่นด้วยช่องว่าง)\n\n**Input:** ประโยค 1 บรรทัด\n**Output:** จำนวนคำ",
     "medium", "sentence = input()\n",
     "print(len(input().split()))",
     [("I love Python very much", V), ("hello", V), ("a b c d e f g", H)])

prob("คำที่ยาวที่สุด", "รับประโยคภาษาอังกฤษ 1 บรรทัด แล้วแสดงคำที่ยาวที่สุด (ถ้ายาวเท่ากันให้เอาคำที่พบก่อน)\n\n**Input:** ประโยค 1 บรรทัด\n**Output:** คำที่ยาวที่สุด",
     "medium", "words = input().split()\n",
     "print(max(input().split(), key=len))",
     [("I love programming in Python", V), ("cat dog bird", V), ("go run fly", H)])

prob("ฟีโบนัชชี n ตัวแรก", "แสดงลำดับฟีโบนัชชี n ตัวแรก (เริ่ม 1 1 2 3 5 …) ในบรรทัดเดียว คั่นด้วยช่องว่าง\n\n**Input:** จำนวนเต็มบวก n\n**Output:** ฟีโบนัชชี n ตัวแรก คั่นด้วยช่องว่าง",
     "medium", "n = int(input())\na, b = 1, 1\n",
     "n=int(input())\na,b=1,1\nout=[]\nfor _ in range(n): out.append(a); a,b=b,a+b\nprint(*out)",
     [("7", V), ("1", V), ("2", H), ("15", H)])

prob("ห.ร.ม.", "รับจำนวนเต็มบวก a และ b แล้วแสดงตัวหารร่วมมาก (ห.ร.ม.)\n\n**Input:** จำนวนเต็มบวก 2 บรรทัด\n**Output:** ห.ร.ม. ของ a และ b",
     "medium", "a = int(input())\nb = int(input())\n# ลองใช้วิธียุคลิด: ขณะที่ b ไม่เป็น 0 ให้ a, b = b, a % b\n",
     "a=int(input());b=int(input())\nwhile b: a,b=b,a%b\nprint(a)",
     [("12\n18", V), ("7\n13", V), ("100\n75", H), ("36\n36", H)])

prob("ค.ร.น.", "รับจำนวนเต็มบวก a และ b แล้วแสดงตัวคูณร่วมน้อย (ค.ร.น.) — เคล็ดลับ: ค.ร.น. = a × b ÷ ห.ร.ม.\n\n**Input:** จำนวนเต็มบวก 2 บรรทัด\n**Output:** ค.ร.น. ของ a และ b",
     "medium", "a = int(input())\nb = int(input())\n",
     "a=int(input());b=int(input())\nx,y=a,b\nwhile y: x,y=y,x%y\nprint(a*b//x)",
     [("4\n6", V), ("3\n5", V), ("12\n18", H), ("7\n7", H)])

prob("ยกกำลังสองทุกตัว", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วแสดงแต่ละค่ายกกำลังสอง คั่นด้วยช่องว่าง\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่ายกกำลังสองตามลำดับเดิม",
     "medium", "nums = [int(x) for x in input().split()]\n",
     "print(*[int(x)**2 for x in input().split()])",
     [("1 2 3 4", V), ("-3 5", V), ("10", H)])

prob("กรองเลขหาร 3 ลงตัว", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว แล้วแสดงเฉพาะค่าที่หารด้วย 3 ลงตัว คั่นด้วยช่องว่าง (รับประกันว่ามีอย่างน้อย 1 ค่า)\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่าที่หาร 3 ลงตัว ตามลำดับเดิม",
     "medium", "nums = [int(x) for x in input().split()]\n",
     "print(*[x for x in (int(v) for v in input().split()) if x%3==0])",
     [("1 3 5 9 10 12", V), ("3", V), ("-3 0 7 6", H)])

prob("นับคนสอบผ่าน", "รับคะแนนสอบของนักเรียนหลายคนในบรรทัดเดียว แล้วนับว่ามีกี่คนที่ได้ 50 คะแนนขึ้นไป\n\n**Input:** คะแนนคั่นด้วยช่องว่าง\n**Output:** จำนวนคนที่ผ่าน",
     "medium", "scores = [int(x) for x in input().split()]\n",
     "print(sum(1 for x in input().split() if int(x)>=50))",
     [("45 80 50 30 90", V), ("100 100", V), ("10 20 30", H)])

prob("มากเป็นอันดับสอง", "รับจำนวนเต็มหลายค่า (อย่างน้อย 2 ค่าที่ต่างกัน) แล้วแสดงค่าที่มาก**เป็นอันดับสอง** โดยไม่นับค่าซ้ำ\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่ามากอันดับสอง",
     "medium", "nums = [int(x) for x in input().split()]\n",
     "print(sorted(set(int(x) for x in input().split()))[-2])",
     [("3 9 1 7", V), ("5 5 8 8 2", V), ("1 2", H), ("10 9 10 8", H)])

prob("ฐานสิบเป็นฐานสอง", "รับจำนวนเต็มบวก n แล้วแสดงค่าในระบบเลขฐานสอง (ไม่มี `0b` นำหน้า)\n\n**Input:** จำนวนเต็มบวก n\n**Output:** เลขฐานสอง",
     "medium", "n = int(input())\n",
     "print(bin(int(input()))[2:])",
     [("10", V), ("1", V), ("255", H), ("100", H)])

prob("ตัวอักษรที่พบบ่อยสุด", "รับคำภาษาอังกฤษ (ตัวพิมพ์เล็ก ไม่มีช่องว่าง) แล้วแสดงตัวอักษรที่ปรากฏบ่อยที่สุด ถ้ามีหลายตัวเท่ากันให้เลือกตัวที่มาก่อนตามลำดับ a-z\n\n**Input:** คำ 1 บรรทัด\n**Output:** ตัวอักษร 1 ตัว",
     "medium", "word = input()\n",
     "s=input();print(min(set(s), key=lambda c:(-s.count(c), c)))",
     [("banana", V), ("hello", V), ("abab", H), ("zzzaaa", H)])

prob("สามเหลี่ยมสร้างได้ไหม", "รับความยาวด้าน 3 ด้าน (จำนวนเต็มบวก) ถ้านำมาสร้างสามเหลี่ยมได้แสดง `yes` ไม่ได้แสดง `no` (เงื่อนไข: ผลรวมของสองด้านใด ๆ ต้องมากกว่าด้านที่เหลือ)\n\n**Input:** จำนวนเต็มบวก 3 บรรทัด\n**Output:** `yes` หรือ `no`",
     "medium", "a = int(input())\nb = int(input())\nc = int(input())\n",
     "a=int(input());b=int(input());c=int(input())\nprint('yes' if a+b>c and a+c>b and b+c>a else 'no')",
     [("3\n4\n5", V), ("1\n2\n10", V), ("2\n2\n4", H), ("7\n7\n7", H)])

prob("วินาทีเป็นนาฬิกา", "รับจำนวนวินาที (0 ≤ s < 86400) แล้วแสดงเป็นเวลารูปแบบ `HH:MM:SS` (เติม 0 ให้ครบสองหลัก — ใช้ f-string `{x:02d}`)\n\n**Input:** จำนวนเต็ม s\n**Output:** เวลารูปแบบ HH:MM:SS",
     "medium", "s = int(input())\n",
     "t=int(input());print(f'{t//3600:02d}:{t%3600//60:02d}:{t%60:02d}')",
     [("3661", V), ("0", V), ("86399", H), ("60", H)])

# ──────────────────────────────── ยาก (20) ────────────────────────────────

prob("ค่ามากที่สุดในลิสต์", "รับจำนวนเต็มหลายค่าในบรรทัดเดียว (คั่นด้วยช่องว่าง) แล้วแสดงค่ามากที่สุด **โดยห้ามใช้ฟังก์ชัน max()**\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง 1 บรรทัด\n**Output:** ค่ามากที่สุด\n\n> เคล็ดลับ: `nums = [int(x) for x in input().split()]`",
     "hard", "nums = [int(x) for x in input().split()]\n# ห้ามใช้ max() — ลองวนลูปเปรียบเทียบเอง\n",
     "a=[int(x) for x in input().split()]\nm=a[0]\nfor x in a:\n    if x>m: m=x\nprint(m)",
     [("3 9 1 7", V), ("-5 -2 -10", V), ("42", H), ("1 2 3 100 99", H)])

prob("นับสระภาษาอังกฤษ", "รับข้อความภาษาอังกฤษ 1 บรรทัด แล้วนับว่ามีสระ (a, e, i, o, u — ทั้งตัวเล็กและตัวใหญ่) กี่ตัว\n\n**Input:** ข้อความ 1 บรรทัด\n**Output:** จำนวนสระ",
     "hard", "text = input()\ncount = 0\n# เขียนต่อตรงนี้\n",
     "print(sum(1 for c in input().lower() if c in 'aeiou'))",
     [("Hello World", V), ("Python", V), ("AEIOU aeiou", H), ("xyz", H)])

prob("เลขเฉพาะหรือไม่", "รับจำนวนเต็ม n (n ≥ 2) ถ้า n เป็นจำนวนเฉพาะให้แสดง `prime` ไม่ใช่ให้แสดง `not prime`\n\nจำนวนเฉพาะคือจำนวนที่หารลงตัวด้วย 1 และตัวมันเองเท่านั้น\n\n**Input:** จำนวนเต็ม n\n**Output:** `prime` หรือ `not prime`",
     "hard", "n = int(input())\n# เขียนต่อตรงนี้\n",
     "n=int(input())\np=n>1\nfor i in range(2,int(n**0.5)+1):\n    if n%i==0: p=False; break\nprint('prime' if p else 'not prime')",
     [("7", V), ("9", V), ("2", H), ("97", H), ("100", H)])

prob("เลขเฉพาะทั้งหมดถึง n", "รับจำนวนเต็ม n (n ≥ 2) แล้วแสดงจำนวนเฉพาะทั้งหมดตั้งแต่ 2 ถึง n ในบรรทัดเดียว คั่นด้วยช่องว่าง\n\n**Input:** จำนวนเต็ม n\n**Output:** จำนวนเฉพาะคั่นด้วยช่องว่าง",
     "hard", "n = int(input())\n",
     "n=int(input())\nout=[]\nfor x in range(2,n+1):\n    p=True\n    for i in range(2,int(x**0.5)+1):\n        if x%i==0: p=False; break\n    if p: out.append(x)\nprint(*out)",
     [("20", V), ("2", V), ("50", H)])

prob("ตัวประกอบทั้งหมด", "รับจำนวนเต็มบวก n แล้วแสดงตัวประกอบทั้งหมดของ n จากน้อยไปมาก คั่นด้วยช่องว่าง\n\n**Input:** จำนวนเต็มบวก n\n**Output:** ตัวประกอบทั้งหมด",
     "hard", "n = int(input())\n",
     "n=int(input())\nprint(*[i for i in range(1,n+1) if n%i==0])",
     [("12", V), ("7", V), ("36", H), ("1", H)])

prob("จำนวนสมบูรณ์", "จำนวนสมบูรณ์ (perfect number) คือจำนวนที่เท่ากับผลรวมของตัวประกอบแท้ (ตัวประกอบที่ไม่รวมตัวเอง) เช่น 6 = 1+2+3 รับ n ถ้าเป็นจำนวนสมบูรณ์แสดง `yes` ไม่ใช่แสดง `no`\n\n**Input:** จำนวนเต็มบวก n\n**Output:** `yes` หรือ `no`",
     "hard", "n = int(input())\n",
     "n=int(input())\nprint('yes' if n>1 and sum(i for i in range(1,n) if n%i==0)==n else 'no')",
     [("6", V), ("10", V), ("28", H), ("496", H), ("1", H)])

prob("แยกตัวประกอบเฉพาะ", "รับจำนวนเต็ม n (n ≥ 2) แล้วแสดงตัวประกอบเฉพาะของ n เรียงจากน้อยไปมาก (ซ้ำได้) คั่นด้วยช่องว่าง เช่น 12 → `2 2 3`\n\n**Input:** จำนวนเต็ม n\n**Output:** ตัวประกอบเฉพาะคั่นด้วยช่องว่าง",
     "hard", "n = int(input())\n",
     "n=int(input())\nout=[]\nd=2\nwhile d*d<=n:\n    while n%d==0: out.append(d); n//=d\n    d+=1\nif n>1: out.append(n)\nprint(*out)",
     [("12", V), ("7", V), ("100", H), ("97", H)])

prob("ประโยคพาลินโดรม", "รับประโยคภาษาอังกฤษ ตรวจว่าเป็นพาลินโดรมหรือไม่ โดย**ไม่สนช่องว่างและตัวพิมพ์เล็ก-ใหญ่** ถ้าใช่แสดง `yes` ไม่ใช่แสดง `no`\n\n**Input:** ประโยค 1 บรรทัด\n**Output:** `yes` หรือ `no`",
     "hard", "text = input()\n",
     "s=input().replace(' ','').lower()\nprint('yes' if s==s[::-1] else 'no')",
     [("never odd or even", V), ("hello world", V), ("Was It A Rat I Saw", H), ("ab", H)])

prob("อนาแกรม", "รับคำภาษาอังกฤษ 2 บรรทัด ถ้าทั้งสองคำเป็นอนาแกรมกัน (ใช้ตัวอักษรชุดเดียวกัน จำนวนเท่ากัน) แสดง `yes` ไม่ใช่แสดง `no`\n\n**Input:** คำ 2 บรรทัด (ตัวพิมพ์เล็ก)\n**Output:** `yes` หรือ `no`",
     "hard", "a = input()\nb = input()\n",
     "print('yes' if sorted(input())==sorted(input()) else 'no')",
     [("listen\nsilent", V), ("hello\nworld", V), ("ab\nab", H), ("aab\nabb", H)])

prob("ฟีโบนัชชีตัวที่ n", "แสดงตัวเลขฟีโบนัชชีลำดับที่ n (F(1) = 1, F(2) = 1, F(n) = F(n-1) + F(n-2)) โดย n อาจใหญ่ถึง 90 — ต้องใช้ลูป ไม่ใช่ recursion ธรรมดา\n\n**Input:** จำนวนเต็ม n (1 ≤ n ≤ 90)\n**Output:** F(n)",
     "hard", "n = int(input())\n",
     "n=int(input())\na,b=1,1\nfor _ in range(n-1): a,b=b,a+b\nprint(a)",
     [("7", V), ("1", V), ("50", H), ("90", H)])

prob("เรียงลำดับด้วยตัวเอง", "รับจำนวนเต็มหลายค่า แล้วแสดงผลเรียงจากน้อยไปมาก **ห้ามใช้ sort() หรือ sorted()** — ลองเขียน bubble sort เอง\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ค่าที่เรียงแล้ว คั่นด้วยช่องว่าง",
     "hard", "nums = [int(x) for x in input().split()]\n# bubble sort: วนเทียบคู่ที่ติดกัน ถ้าสลับลำดับผิดให้สลับที่\n",
     "a=[int(x) for x in input().split()]\nfor i in range(len(a)):\n    for j in range(len(a)-1-i):\n        if a[j]>a[j+1]: a[j],a[j+1]=a[j+1],a[j]\nprint(*a)",
     [("5 2 8 1 9", V), ("3 3 1", V), ("10", H), ("-4 0 -9 7", H)])

prob("นับคู่ผลรวมเท่ากับ k", "รับลิสต์จำนวนเต็มในบรรทัดแรก และค่า k ในบรรทัดที่สอง นับจำนวนคู่ (i, j) ที่ i < j และ nums[i] + nums[j] = k\n\n**Input:** ลิสต์ 1 บรรทัด และ k 1 บรรทัด\n**Output:** จำนวนคู่",
     "hard", "nums = [int(x) for x in input().split()]\nk = int(input())\n",
     "a=[int(x) for x in input().split()]\nk=int(input())\nc=0\nfor i in range(len(a)):\n    for j in range(i+1,len(a)):\n        if a[i]+a[j]==k: c+=1\nprint(c)",
     [("1 2 3 4 5\n6", V), ("1 1 1\n2", V), ("5\n10", H), ("2 2 2 2\n4", H)])

prob("ผลรวมช่วงย่อยมากสุด", "รับจำนวนเต็มหลายค่า (มีค่าติดลบได้) แล้วหาผลรวมของ**ช่วงที่ติดกัน**ที่มากที่สุด เช่น `[-2, 1, -3, 4, -1, 2, 1, -5, 4]` ช่วงที่ดีที่สุดคือ `[4, -1, 2, 1]` รวมได้ 6\n\n**Input:** จำนวนเต็มคั่นด้วยช่องว่าง\n**Output:** ผลรวมช่วงย่อยมากสุด",
     "hard", "nums = [int(x) for x in input().split()]\n",
     "a=[int(x) for x in input().split()]\nbest=cur=a[0]\nfor x in a[1:]:\n    cur=max(x,cur+x)\n    best=max(best,cur)\nprint(best)",
     [("-2 1 -3 4 -1 2 1 -5 4", V), ("1 2 3", V), ("-5 -1 -8", H), ("5 -9 6 -2 3", H)])

prob("รหัสซีซาร์", "เข้ารหัสข้อความด้วยการเลื่อนตัวอักษร: รับข้อความ (ตัวพิมพ์เล็ก a-z และช่องว่าง) และจำนวนเลื่อน k แล้วเลื่อนตัวอักษรแต่ละตัวไป k ตำแหน่ง (วนกลับ z → a) ช่องว่างคงเดิม\n\n**Input:** ข้อความ 1 บรรทัด และ k 1 บรรทัด\n**Output:** ข้อความที่เข้ารหัสแล้ว",
     "hard", "text = input()\nk = int(input())\n# chr() และ ord() ช่วยแปลงตัวอักษร <-> รหัสตัวเลข\n",
     "s=input();k=int(input())\nprint(''.join(c if c==' ' else chr((ord(c)-97+k)%26+97) for c in s))",
     [("abc\n1", V), ("hello world\n3", V), ("xyz\n3", H), ("attack at dawn\n13", H)])

prob("วงเล็บสมดุล", "รับข้อความที่มีเฉพาะวงเล็บ `()[]{}` ตรวจว่าเปิด-ปิดถูกต้องครบคู่และซ้อนกันถูกลำดับหรือไม่ ถ้าถูกแสดง `valid` ผิดแสดง `invalid`\n\n**Input:** ข้อความวงเล็บ 1 บรรทัด\n**Output:** `valid` หรือ `invalid`",
     "hard", "s = input()\n# ใช้ลิสต์เป็น stack: เจอวงเล็บเปิด push เจอวงเล็บปิด pop มาเทียบ\n",
     "s=input()\nst=[]\npair={')':'(',']':'[','}':'{'}\nok=True\nfor c in s:\n    if c in '([{': st.append(c)\n    elif not st or st.pop()!=pair[c]: ok=False; break\nprint('valid' if ok and not st else 'invalid')",
     [("([]{})", V), ("([)]", V), ("(((", H), ("{}", H), ("]", H)])

prob("เลขโรมันเป็นอารบิก", "รับเลขโรมัน (I, V, X, L, C, D, M) แล้วแปลงเป็นเลขอารบิก เช่น `XIV` → 14 (ถ้าตัวซ้ายน้อยกว่าตัวขวาให้ลบ)\n\n**Input:** เลขโรมัน 1 บรรทัด\n**Output:** จำนวนเต็ม",
     "hard", "roman = input()\nvalues = {\"I\": 1, \"V\": 5, \"X\": 10, \"L\": 50, \"C\": 100, \"D\": 500, \"M\": 1000}\n",
     "s=input()\nv={'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}\ntotal=0\nfor i,c in enumerate(s):\n    if i+1<len(s) and v[c]<v[s[i+1]]: total-=v[c]\n    else: total+=v[c]\nprint(total)",
     [("XIV", V), ("IX", V), ("MMXXIV", H), ("MCMXCIV", H), ("III", H)])

prob("อารบิกเป็นเลขโรมัน", "รับจำนวนเต็ม n (1 ≤ n ≤ 3999) แล้วแปลงเป็นเลขโรมัน\n\n**Input:** จำนวนเต็ม n\n**Output:** เลขโรมัน",
     "hard", "n = int(input())\n# จับคู่ค่า-สัญลักษณ์จากมากไปน้อย: 1000 M, 900 CM, 500 D, 400 CD, ...\n",
     "n=int(input())\npairs=[(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),(90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]\nout=''\nfor val,sym in pairs:\n    while n>=val: out+=sym; n-=val\nprint(out)",
     [("14", V), ("9", V), ("2024", H), ("1994", H), ("3999", H)])

prob("คำที่พบบ่อยสุด", "รับประโยคภาษาอังกฤษ (ตัวพิมพ์เล็ก) แล้วแสดงคำที่ปรากฏบ่อยที่สุด ถ้ามีหลายคำเท่ากันให้เลือกคำที่มาก่อนตามลำดับพจนานุกรม\n\n**Input:** ประโยค 1 บรรทัด\n**Output:** คำ 1 คำ",
     "hard", "words = input().split()\n",
     "w=input().split()\nprint(min(set(w), key=lambda x:(-w.count(x), x)))",
     [("the cat and the dog and the bird", V), ("a b a b", V), ("one two three", H), ("z z y y x", H)])

prob("ลำดับโคลัทซ์", "ลำดับโคลัทซ์: ถ้า n เป็นเลขคู่ให้ n = n ÷ 2 ถ้าเป็นเลขคี่ให้ n = 3n + 1 ทำซ้ำจนกว่า n = 1 รับ n แล้วนับว่าต้องทำกี่ขั้นตอนจึงถึง 1\n\n**Input:** จำนวนเต็ม n (n ≥ 1)\n**Output:** จำนวนขั้นตอน",
     "hard", "n = int(input())\nsteps = 0\n",
     "n=int(input())\nc=0\nwhile n!=1:\n    n=n//2 if n%2==0 else 3*n+1\n    c+=1\nprint(c)",
     [("6", V), ("1", V), ("27", H), ("7", H)])

prob("วิธีขึ้นบันได", "บันไดมี n ขั้น เดินขึ้นได้ครั้งละ 1 หรือ 2 ขั้น มีวิธีขึ้นที่ต่างกันทั้งหมดกี่วิธี? (n อาจใหญ่ถึง 90 — ใช้ลูปแบบฟีโบนัชชี)\n\n**Input:** จำนวนเต็ม n (1 ≤ n ≤ 90)\n**Output:** จำนวนวิธี",
     "hard", "n = int(input())\n# จำนวนวิธีของขั้น n = วิธีของขั้น n-1 + วิธีของขั้น n-2\n",
     "n=int(input())\na,b=1,1\nfor _ in range(n): a,b=b,a+b\nprint(a)",
     [("3", V), ("1", V), ("10", H), ("90", H)])


# ──────────────────────────── สร้าง expected output ────────────────────────────

def run(sol, inp):
    g = {"__name__": "__main__"}
    buf = io.StringIO()
    fake_in = io.StringIO(inp)

    def fake_input(prompt=""):
        line = fake_in.readline()
        if not line:
            raise EOFError("input หมด")
        return line.rstrip("\n")

    g["input"] = fake_input
    old_stdin = sys.stdin
    sys.stdin = fake_in
    try:
        with contextlib.redirect_stdout(buf):
            exec(sol, g)
    finally:
        sys.stdin = old_stdin
    return buf.getvalue().rstrip("\n")


def main():
    counts = {"easy": 0, "medium": 0, "hard": 0}
    out = []
    for p in P:
        counts[p["diff"]] += 1
        tests = []
        for inp, hidden in p["tests"]:
            tests.append({"input": inp, "expected_output": run(p["sol"], inp), "hidden": hidden})
        first = next(t for t in tests if not t["hidden"])
        example = "\n\n### ตัวอย่าง\n"
        if first["input"]:
            example += "Input:\n```\n" + first["input"] + "\n```\n"
        example += "Output:\n```\n" + first["expected_output"] + "\n```"
        out.append({
            "title": p["title"],
            "description": p["desc"] + example,
            "difficulty": p["diff"],
            "starter_code": p["starter"],
            "tests": tests,
        })

    dest = os.path.join(os.path.dirname(__file__), "..", "lib", "seed-problems.json")
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"generated {len(out)} problems:", counts)
    assert counts == {"easy": 50, "medium": 30, "hard": 20}, "จำนวนโจทย์ไม่ตรงเป้า!"


if __name__ == "__main__":
    main()
