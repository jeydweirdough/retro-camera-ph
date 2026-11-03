import { loadCatalog } from "@/lib/data/catalog";
import { getFaqs } from "@/lib/data/content";
import { buildLlmsTxt } from "@/lib/llms-txt";

export async function GET() {
  const [catalog, faqs] = await Promise.all([loadCatalog(), getFaqs()]);

  return new Response(buildLlmsTxt(catalog, faqs), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
