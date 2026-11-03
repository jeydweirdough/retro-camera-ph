import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";
import { isSanityConfigured } from "@/sanity/env";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <main className="mx-auto max-w-lg p-8 text-sm">
        Sanity is not configured. Add <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> to{" "}
        <code>.env.local</code> and restart the dev server.
      </main>
    );
  }

  return <NextStudio config={config} />;
}
