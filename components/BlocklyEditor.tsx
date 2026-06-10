"use client";

import { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { pythonGenerator, Order } from "blockly/python";
import * as Th from "blockly/msg/th";

let initialized = false;

function initBlockly() {
  if (initialized) return;
  initialized = true;

  Blockly.setLocale(Th as unknown as { [key: string]: string });

  // บล็อกเสริมสำหรับรับข้อมูล แบบที่โจทย์ใช้
  Blockly.defineBlocksWithJsonArray([
    {
      type: "py_input",
      message0: "รับข้อความ input()",
      output: "String",
      colour: 160,
      tooltip: "รับข้อมูลหนึ่งบรรทัดเป็นข้อความ",
    },
    {
      type: "py_input_int",
      message0: "รับตัวเลข int(input())",
      output: "Number",
      colour: 160,
      tooltip: "รับข้อมูลหนึ่งบรรทัดแล้วแปลงเป็นจำนวนเต็ม",
    },
    {
      type: "py_fstring2",
      message0: "ต่อข้อความ %1 กับ %2",
      args0: [
        { type: "input_value", name: "A" },
        { type: "input_value", name: "B" },
      ],
      output: "String",
      colour: 160,
      inputsInline: true,
      tooltip: "เชื่อมค่าสองค่าเป็นข้อความเดียว (มีช่องว่างคั่น)",
    },
  ]);

  pythonGenerator.forBlock["py_input"] = () => ["input()", Order.FUNCTION_CALL];
  pythonGenerator.forBlock["py_input_int"] = () => ["int(input())", Order.FUNCTION_CALL];
  pythonGenerator.forBlock["py_fstring2"] = (block, gen) => {
    const a = gen.valueToCode(block, "A", Order.NONE) || "''";
    const b = gen.valueToCode(block, "B", Order.NONE) || "''";
    return [`f"{${a}} {${b}}"`, Order.FUNCTION_CALL];
  };
}

const TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category", name: "ตรรกะ", colour: "210",
      contents: [
        { kind: "block", type: "controls_if" },
        { kind: "block", type: "logic_compare" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "logic_negate" },
        { kind: "block", type: "logic_boolean" },
      ],
    },
    {
      kind: "category", name: "วนซ้ำ", colour: "120",
      contents: [
        { kind: "block", type: "controls_repeat_ext" },
        { kind: "block", type: "controls_whileUntil" },
        { kind: "block", type: "controls_for" },
        { kind: "block", type: "controls_flow_statements" },
      ],
    },
    {
      kind: "category", name: "คณิตศาสตร์", colour: "230",
      contents: [
        { kind: "block", type: "math_number" },
        { kind: "block", type: "math_arithmetic" },
        { kind: "block", type: "math_modulo" },
        { kind: "block", type: "math_number_property" },
      ],
    },
    {
      kind: "category", name: "ข้อความ", colour: "160",
      contents: [
        { kind: "block", type: "text" },
        { kind: "block", type: "text_print" },
        { kind: "block", type: "py_input" },
        { kind: "block", type: "py_input_int" },
        { kind: "block", type: "py_fstring2" },
        { kind: "block", type: "text_join" },
        { kind: "block", type: "text_length" },
      ],
    },
    {
      kind: "category", name: "รายการ", colour: "260",
      contents: [
        { kind: "block", type: "lists_create_with" },
        { kind: "block", type: "lists_length" },
        { kind: "block", type: "lists_repeat" },
      ],
    },
    { kind: "category", name: "ตัวแปร", colour: "330", custom: "VARIABLE" },
    { kind: "category", name: "ฟังก์ชัน", colour: "290", custom: "PROCEDURE" },
  ],
};

export default function BlocklyEditor({
  onCodeChange,
  storageKey,
}: {
  onCodeChange: (code: string) => void;
  storageKey: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const onCodeChangeRef = useRef(onCodeChange);
  onCodeChangeRef.current = onCodeChange;

  useEffect(() => {
    if (!divRef.current) return;
    initBlockly();

    const ws = Blockly.inject(divRef.current, {
      toolbox: TOOLBOX,
      renderer: "zelos", // เรนเดอร์แบบ Scratch จับง่ายบนมือถือ
      zoom: { controls: true, wheel: true, startScale: 0.8, pinch: true },
      move: { scrollbars: true, drag: true, wheel: true },
      trashcan: true,
    });
    wsRef.current = ws;

    // โหลดบล็อกที่เคยต่อไว้ของโจทย์ข้อนี้
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        Blockly.serialization.workspaces.load(JSON.parse(saved), ws);
      }
    } catch {
      /* ข้อมูลเก่าเสียหาย เริ่มใหม่ */
    }

    const listener = () => {
      const code = pythonGenerator.workspaceToCode(ws);
      onCodeChangeRef.current(code);
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(Blockly.serialization.workspaces.save(ws))
        );
      } catch {
        /* localStorage เต็ม/ปิดอยู่ ก็ข้ามไป */
      }
    };
    ws.addChangeListener(listener);
    listener();

    const onResize = () => Blockly.svgResize(ws);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ws.dispose();
      wsRef.current = null;
    };
  }, [storageKey]);

  return <div ref={divRef} className="w-full h-full min-h-[380px]" />;
}
