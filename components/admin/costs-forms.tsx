"use client";

import { useActionState, type ReactNode } from "react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { cn } from "@/lib/cn";
import { importCostsAction, saveCostsAction, type CostsResult } from "@/lib/costs/actions";

function Result({ result }: { result: CostsResult | null }) {
  if (!result) return null;
  return (
    <div role="status" className={cn("text-sm", result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600")}>
      <p>{result.message}</p>
      {result.problems && (
        <ul className="mt-1 list-disc pl-5">
          {result.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Wraps the server-rendered costs table so it saves through one action. */
export function CostsTableForm({ children }: { children: ReactNode }) {
  const [result, action] = useActionState(saveCostsAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Save costs</SubmitButton>
        <Result result={result} />
      </div>
    </form>
  );
}

export function CostsImportForm() {
  const [result, action] = useActionState(importCostsAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Import costs from CSV</span>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:font-medium dark:file:bg-zinc-800"
        />
        <span className="text-xs text-zinc-500">
          Columns: product_id (or slug) and cost_PHP. Blank costs are left unchanged. Nothing is saved if any row has a
          problem.
        </span>
      </label>
      <SubmitButton variant="secondary" size="sm" className="self-start">
        Import
      </SubmitButton>
      <Result result={result} />
    </form>
  );
}
