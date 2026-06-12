import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProblemEditor from "@/components/admin/ProblemEditor";
import { getSession } from "@/lib/auth";
import { getProblem, getTestCases } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminProblemEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await getSession();
  if (!s || s.role !== "teacher") redirect("/login");

  const { id } = await params;
  const problem = await getProblem(Number(id));
  if (!problem) notFound();

  const tests = (await getTestCases(problem.id)).map((t) => ({
    input: t.input,
    expected_output: t.expected_output,
    hidden: !!t.hidden,
  }));

  return (
    <AppShell session={s} active="/admin/problems">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/admin/problems" className="text-sm text-indigo-600 hover:underline">
          ← โจทย์ทั้งหมด
        </Link>
        <Link href={`/problems/${problem.id}`} className="text-sm text-slate-500 hover:underline">
          👁 ดูแบบนักเรียน
        </Link>
      </div>
      <ProblemEditor problem={problem} initialTests={tests} />
    </AppShell>
  );
}
