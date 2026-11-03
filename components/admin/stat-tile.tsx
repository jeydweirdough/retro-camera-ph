import { Card } from "@/components/ui/card/card";

/** One figure: a label, the value, and an optional note under it. */
export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card padding="sm" className="flex flex-col gap-1">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {note && <p className="text-xs text-zinc-500">{note}</p>}
    </Card>
  );
}
