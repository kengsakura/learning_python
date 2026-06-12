import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Markdown from "@/components/Markdown";
import QuizPlayer from "@/components/QuizPlayer";
import CompleteLessonButton from "@/components/CompleteLessonButton";
import { getSession } from "@/lib/auth";
import { getLesson, getQuestions, getProgress, listLessons } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const { id } = await params;
  const lesson = await getLesson(Number(id));
  if (!lesson || (!lesson.published && s.role !== "teacher")) notFound();

  // ส่งคำถามไปหน้าเว็บโดยไม่แนบเฉลย — ตรวจที่เซิร์ฟเวอร์
  const questions = (await getQuestions(lesson.id)).map((q) => ({
    id: q.id,
    question: q.question,
    choices: JSON.parse(q.choices) as string[],
  }));

  const all = await listLessons();
  const idx = all.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const done = s.role === "student" ? (await getProgress(s.userId)).has(lesson.id) : false;

  return (
    <AppShell session={s} active="/learn">
      <div className="mb-3">
        <Link href="/learn" className="text-sm text-indigo-600 hover:underline">
          ← กลับไปหน้าบทเรียน
        </Link>
      </div>

      <article className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-4">
        <Markdown>{lesson.content}</Markdown>
        {s.role === "student" && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <CompleteLessonButton lessonId={lesson.id} done={done} />
          </div>
        )}
      </article>

      {s.role === "student" && <QuizPlayer lessonId={lesson.id} questions={questions} />}

      <div className="flex justify-between mt-5 gap-3">
        {prev ? (
          <Link
            href={`/learn/${prev.id}`}
            className="text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 hover:border-indigo-300 truncate"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/learn/${next.id}`}
            className="text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 hover:border-indigo-300 truncate text-right"
          >
            {next.title} →
          </Link>
        )}
      </div>
    </AppShell>
  );
}
