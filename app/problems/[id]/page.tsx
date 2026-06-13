import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProblemWorkspace from "@/components/ProblemWorkspace";
import { getSession } from "@/lib/auth";
import { getProblem, getTestCases, getSolvedProblems, getDraft } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");

  const { id } = await params;
  const problem = await getProblem(Number(id));
  if (!problem || (!problem.published && s.role !== "teacher")) notFound();

  const tests = await getTestCases(problem.id);
  const isStudent = s.role === "student";
  const solved = isStudent ? (await getSolvedProblems(s.userId)).has(problem.id) : false;
  const draft = isStudent ? await getDraft(s.userId, problem.id) : undefined;

  return (
    <AppShell session={s} active="/problems">
      <div className="mb-3">
        <Link href="/problems" className="text-sm text-indigo-600 hover:underline">
          ← กลับไปหน้าโจทย์
        </Link>
      </div>
      <ProblemWorkspace
        problem={{
          id: problem.id,
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          starter_code: problem.starter_code,
        }}
        tests={tests}
        alreadySolved={solved}
        initialCode={draft?.code}
        initialMode={draft?.mode}
        saveDraft={isStudent}
      />
    </AppShell>
  );
}
