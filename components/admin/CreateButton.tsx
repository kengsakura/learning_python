"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateButton({
  endpoint,
  redirectBase,
  label,
}: {
  endpoint: string;
  redirectBase: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        const title = window.prompt("ตั้งชื่อ:");
        if (!title) return;
        setLoading(true);
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          });
          const data = await res.json();
          if (res.ok) router.push(`${redirectBase}/${data.id}`);
        } finally {
          setLoading(false);
        }
      }}
      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold px-4 py-2 rounded-xl"
    >
      {loading ? "กำลังสร้าง…" : label}
    </button>
  );
}
