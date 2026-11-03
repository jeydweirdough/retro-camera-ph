"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { cn } from "@/lib/cn";
import { uploadReceiptAction } from "@/lib/orders/actions";

export function ReceiptUploadForm({ code, replacing }: { code: string; replacing: boolean }) {
  const [result, action] = useActionState(uploadReceiptAction, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="code" value={code} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">{replacing ? "Upload a different receipt" : "Upload your payment receipt"}</span>
        <input
          type="file"
          name="receipt"
          accept="image/png,image/jpeg,image/webp"
          required
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:font-medium dark:file:bg-zinc-800"
        />
        <span className="text-xs text-zinc-500">
          A screenshot showing the amount, reference number and recipient. PNG, JPG or WebP, up to 5 MB.
        </span>
      </label>
      <SubmitButton className="self-start">Upload receipt</SubmitButton>
      <p role="status" className={cn("min-h-5 text-sm", result?.ok === false && "text-red-600")}>
        {result?.message}
      </p>
    </form>
  );
}
