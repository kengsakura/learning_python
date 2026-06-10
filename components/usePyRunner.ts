"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TestResult = { passed: boolean; output: string; error: string | null };
type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const RUN_TIMEOUT_MS = 15000;

// จัดการ Web Worker ที่รัน Pyodide — ถ้าโค้ดวนลูปไม่จบจะ terminate แล้วสร้างใหม่
export function usePyRunner() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<number, Pending>>(new Map());
  const idRef = useRef(0);
  const [status, setStatus] = useState<"loading" | "ready" | "running">("loading");

  const spawn = useCallback(() => {
    workerRef.current?.terminate();
    setStatus("loading");
    const w = new Worker("/py-worker.js");
    w.onmessage = (e) => {
      const { id, type } = e.data;
      const p = pendingRef.current.get(id);
      if (type === "ready") setStatus("ready");
      if (!p) return;
      clearTimeout(p.timer);
      pendingRef.current.delete(id);
      if (type === "fatal") p.reject(new Error(e.data.error));
      else p.resolve(e.data);
      if (type !== "ready") setStatus("ready");
    };
    workerRef.current = w;
    const id = ++idRef.current;
    pendingRef.current.set(id, {
      resolve: () => {},
      reject: () => {},
      timer: setTimeout(() => {}, 0),
    });
    w.postMessage({ id, type: "warmup" });
  }, []);

  useEffect(() => {
    spawn();
    return () => workerRef.current?.terminate();
  }, [spawn]);

  const send = useCallback(
    (msg: Record<string, unknown>): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        const w = workerRef.current;
        if (!w) return reject(new Error("worker ยังไม่พร้อม"));
        const id = ++idRef.current;
        setStatus("running");
        const timer = setTimeout(() => {
          pendingRef.current.delete(id);
          spawn(); // โค้ดน่าจะวนลูปไม่จบ — รีเซ็ต worker
          reject(new Error("รันนานเกินไป (อาจมีลูปไม่จบ) ระบบหยุดการทำงานให้แล้ว"));
        }, RUN_TIMEOUT_MS);
        pendingRef.current.set(id, { resolve, reject, timer });
        w.postMessage({ id, ...msg });
      });
    },
    [spawn]
  );

  const runTests = useCallback(
    async (code: string, tests: { input: string; expected: string }[]): Promise<TestResult[]> => {
      const res = (await send({ type: "runTests", code, tests })) as { results: TestResult[] };
      return res.results;
    },
    [send]
  );

  const runOnce = useCallback(
    async (code: string, input: string): Promise<{ output: string; error: string | null }> => {
      const res = (await send({ type: "runOnce", code, input })) as {
        output: string;
        error: string | null;
      };
      return res;
    },
    [send]
  );

  return { status, runTests, runOnce };
}
