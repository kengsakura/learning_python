// Web Worker สำหรับรันโค้ด Python ด้วย Pyodide (รันใน browser ทั้งหมด)
// แยกเป็น worker เพื่อให้หน้าเว็บไม่ค้าง และยกเลิกได้เมื่อโค้ดวนลูปไม่จบ

importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodideReady = loadPyodide({
  indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
});

const HARNESS = `
import sys, io, builtins, traceback

def __run_user_code(user_code, stdin_text):
    out = io.StringIO()
    fake_in = io.StringIO(stdin_text)

    def fake_input(prompt=""):
        line = fake_in.readline()
        if not line:
            raise EOFError("input() ถูกเรียกแต่ไม่มีข้อมูลเหลือแล้ว")
        return line.rstrip("\\n")

    g = {"__name__": "__main__", "input": fake_input}
    old_stdout, old_stdin = sys.stdout, sys.stdin
    sys.stdout, sys.stdin = out, fake_in
    err = None
    try:
        exec(user_code, g)
    except BaseException:
        # เอาเฉพาะท้าย traceback ซึ่งเป็นส่วนที่เกี่ยวกับโค้ดของผู้เรียน
        err = "\\n".join(traceback.format_exc().splitlines()[-3:])
    finally:
        sys.stdout, sys.stdin = old_stdout, old_stdin
    return out.getvalue(), err
`;

self.onmessage = async (event) => {
  const { id, type, code, tests, input } = event.data;
  try {
    const pyodide = await pyodideReady;
    await pyodide.runPythonAsync(HARNESS);
    const runner = pyodide.globals.get("__run_user_code");

    if (type === "runTests") {
      const results = [];
      for (const t of tests) {
        const res = runner(code, t.input ?? "");
        const output = res.get(0);
        const error = res.get(1);
        res.destroy();
        const expected = String(t.expected ?? "").replace(/\r\n/g, "\n").trimEnd();
        const actual = String(output ?? "").replace(/\r\n/g, "\n").trimEnd();
        results.push({
          passed: !error && actual === expected,
          output: actual,
          error: error || null,
        });
      }
      runner.destroy();
      self.postMessage({ id, type: "testResults", results });
    } else if (type === "runOnce") {
      const res = runner(code, input ?? "");
      const output = res.get(0);
      const error = res.get(1);
      res.destroy();
      runner.destroy();
      self.postMessage({ id, type: "runResult", output: String(output ?? ""), error: error || null });
    } else if (type === "warmup") {
      self.postMessage({ id, type: "ready" });
    }
  } catch (e) {
    self.postMessage({ id, type: "fatal", error: String(e) });
  }
};
