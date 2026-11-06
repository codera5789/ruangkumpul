"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ToolLabel, ToolPanel } from "@/modules/tools/components/tool-shell";

interface ValidationSuccess {
  status: "valid";
  rootType: string;
  bytes: number;
}

interface ValidationError {
  status: "invalid";
  message: string;
  line: number | null;
  column: number | null;
}

type ValidationOutcome = ValidationSuccess | ValidationError;

const textEncoder = new TextEncoder();

function describeRoot(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value; // "object" | "string" | "number" | "boolean"
}

export default function JsonValidator() {
  const [input, setInput] = useState("");
  const [outcome, setOutcome] = useState<ValidationOutcome | null>(null);

  function handleValidate() {
    if (input.trim() === "") {
      setOutcome({
        status: "invalid",
        message: "Masukkan JSON terlebih dahulu.",
        line: null,
        column: null,
      });
      return;
    }

    try {
      const parsed: unknown = JSON.parse(input);
      setOutcome({
        status: "valid",
        rootType: describeRoot(parsed),
        bytes: textEncoder.encode(input).length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "JSON tidak valid.";
      const positionMatch = /position\s+(\d+)/i.exec(message);

      if (positionMatch) {
        // Konversi offset karakter (UTF-16 code unit) menjadi baris & kolom.
        const offset = Math.min(Number(positionMatch[1]), input.length);
        const before = input.slice(0, offset);
        const line = (before.match(/\n/g) ?? []).length + 1;
        const column = offset - before.lastIndexOf("\n");
        setOutcome({ status: "invalid", message, line, column });
      } else {
        setOutcome({ status: "invalid", message, line: null, column: null });
      }
    }
  }

  return (
    <ToolPanel>
      <ToolLabel htmlFor="json-validator-input" hint="Tempel JSON di sini">
        Input JSON
      </ToolLabel>
      <Textarea
        id="json-validator-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        className="font-mono text-[13px]"
        placeholder={'{ "status": "ok" }'}
        spellCheck={false}
      />

      <div className="mt-4">
        <Button onClick={handleValidate}>Validasi</Button>
      </div>

      {outcome?.status === "valid" ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800"
        >
          <p className="font-bold">JSON valid!</p>
          <p className="mt-1">
            Tipe root: <span className="font-mono font-semibold">{outcome.rootType}</span>
            {" · "}
            Jumlah byte: {new Intl.NumberFormat("id-ID").format(outcome.bytes)}
          </p>
        </div>
      ) : null}

      {outcome?.status === "invalid" ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <p className="font-bold">JSON tidak valid</p>
          <p className="mt-1 break-words font-mono text-xs leading-relaxed">
            {outcome.line !== null && outcome.column !== null
              ? `Baris ${outcome.line}, Kolom ${outcome.column}: ${outcome.message}`
              : outcome.message}
          </p>
        </div>
      ) : null}
    </ToolPanel>
  );
}
