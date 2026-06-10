"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteLessonButton({
  lessonId,
  done,
}: {
  lessonId: number;
  done: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
        ✓ เรียนบทนี้จบแล้ว
      </span>
    );
  }
  return (
    <button
      disabled={saving}
      onClick={async () => {
        setSaving(true);
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId }),
        });
        router.refresh();
      }}
      className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white text-sm font-semibold px-4 py-2 rounded-xl"
    >
      {saving ? "กำลังบันทึก…" : "✓ ทำเครื่องหมายว่าเรียนจบบทนี้"}
    </button>
  );
}
