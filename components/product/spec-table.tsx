import type { Spec } from "@/lib/domain/specs";

/** Renders any product's `getSpecs()`, whatever its type. */
export function SpecTable({ specs }: { specs: Spec[] }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Specifications</caption>
      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {specs.map((spec) => (
          <tr key={spec.label}>
            <th scope="row" className="py-2 pr-4 text-left font-normal text-zinc-500">
              {spec.label}
            </th>
            <td className="py-2">{spec.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
