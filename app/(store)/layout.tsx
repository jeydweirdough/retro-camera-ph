import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { storeJsonLd } from "@/lib/seo";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-8">{children}</main>
      <SiteFooter />
      <JsonLd data={storeJsonLd()} />
    </>
  );
}
