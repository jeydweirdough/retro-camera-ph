import type { Metadata } from "next";
import type { Faq } from "@/lib/data/content";
import type { Product } from "@/lib/domain/product";
import { absoluteUrl, site } from "@/lib/site";

export interface Crumb {
  name: string;
  href: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}

export function storeJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: site.name,
      url: site.url,
      logo: absoluteUrl(site.logo),
      description: site.description,
      sameAs: Object.values(site.social),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
  ];
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function productMetadata(product: Product): Metadata {
  const title = `${product.name} – ${product.price().format()}`;
  const images = product.images.slice(0, 1).map((image) => ({ url: image.url, alt: image.alt }));

  return {
    title,
    description: product.description,
    alternates: { canonical: product.path },
    openGraph: { title, description: product.description, url: product.path, images },
  };
}
