import { JsonLd } from "@/components/seo/json-ld";
import type { Faq } from "@/lib/data/content";
import { faqJsonLd } from "@/lib/seo";

/** Expandable Q&A list plus FAQPage data, from the same FAQs. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="faq-heading" className="flex flex-col gap-4">
      <h2 id="faq-heading" className="text-xl font-semibold">
        Frequently asked questions
      </h2>
      <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {faqs.map((faq) => (
          <details key={faq.question} className="group p-4">
            <summary className="cursor-pointer font-medium marker:text-zinc-400">{faq.question}</summary>
            <p className="mt-2 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqJsonLd(faqs)} />
    </section>
  );
}
