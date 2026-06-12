import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import LessonEditor from "@/components/admin/LessonEditor";
import { getSession } from "@/lib/auth";
import { getLesson, getQuestions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminLessonEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "teacher") redirect("/login");

  const { id } = await params;
  const lesson = await getLesson(Number(id));
  if (!lesson) notFound();

  const questions = (await getQuestions(lesson.id)).map((q) => ({
    question: q.question,
    choices: JSON.parse(q.choices) as string[],
    answer_index: q.answer_index,
    explanation: q.explanation,
  }));

  return (
    <AppShell session={s} active="/admin/lessons">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/admin/lessons" className="text-sm text-indigo-600 hover:underline">
          ← บทเรียนทั้งหมด
        </Link>
        <Link href={`/learn/${lesson.id}`} className="text-sm text-slate-500 hover:underline">
          👁 ดูแบบนักเรียน
        </Link>
      </div>
      <LessonEditor lesson={lesson} initialQuestions={questions} />
    </AppShell>
  );
}
