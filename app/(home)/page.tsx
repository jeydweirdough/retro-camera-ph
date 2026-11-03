import { FaqList } from "@/components/content/faq-list";
import { GallerySection, FiltersSection, IntroCards, PhotoOfTheDaySection } from "@/components/home/gallery-sections";
import {
  CreativesSection,
  FollowSection,
  HeroSection,
  ProductDetailsSection,
  WhoWeAreSection,
} from "@/components/home/hero-section";
import { HomeMotion } from "@/components/home/home-motion";
import { Marquee } from "@/components/home/marquee";
import {
  CollectionsSection,
  PillarsSection,
  SpotlightSection,
  type CollectionItem,
} from "@/components/home/spotlight-sections";
import { loadCatalog } from "@/lib/data/catalog";
import { getFaqs } from "@/lib/data/content";
import { CATEGORIES } from "@/lib/domain/categories";
import { homePhotos } from "@/lib/home/content";

const ROOT_ID = "home-root";

export default async function Home() {
  const [catalog, faqs] = await Promise.all([loadCatalog(), getFaqs()]);

  const counts = Object.fromEntries(
    Object.values(CATEGORIES).map((category) => [category.type, catalog.ofType(category.type).length]),
  );

  // Real catalog cameras when there are enough with photos; the store's cut-outs otherwise.
  const withPhotos = catalog.ofType("camera").filter((product) => product.images.length > 0).slice(0, 3);
  const collections: CollectionItem[] =
    withPhotos.length === 3
      ? withPhotos.map((product, i) => ({
          href: product.path,
          name: product.name,
          imageUrl: product.images[0].url,
          photo: homePhotos.collections[i],
        }))
      : homePhotos.collections.map((photo) => ({
          href: `/shop/${CATEGORIES.camera.slug}`,
          name: photo.name ?? photo.alt,
          photo,
        }));

  return (
    <div id={ROOT_ID} className="home-root bg-[#f6f2ea] text-[#1f160c]">
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5">
        <div className="home-progress h-full bg-gradient-to-r from-[#f7c934] via-[#ee6a1c] to-[#ff5a0a]" />
      </div>

      <main>
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          <HeroSection />
          <WhoWeAreSection />
          <ProductDetailsSection />
          <CreativesSection />
          <FollowSection />
        </div>

        <div className="mt-24 sm:mt-32">
          <Marquee words={["Film", "Rangefinder", "Point & Shoot", "SLR", "Toy Camera", "Lenses"]} />
        </div>

        <div className="bg-[#d9d9d9] px-2 py-2 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-[1100px] rounded-[28px] bg-white px-4 py-12 sm:px-10 sm:py-16">
            <IntroCards />
            <GallerySection />
            <FiltersSection counts={counts} />
            <PhotoOfTheDaySection />
          </div>
        </div>

        <Marquee dark words={["New & Vintage", "Condition Graded", "Pay by QR", "Las Piñas", "Ready to Shoot"]} />

        <div className="bg-[#c7b1a8] px-2 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-[1100px] rounded-[26px] bg-[#e9e9e9] p-2 sm:p-3">
            <SpotlightSection />
            <PillarsSection />
            <CollectionsSection items={collections} />
          </div>
        </div>

        {faqs.length > 0 && (
          <div className="mx-auto w-full max-w-[1240px] px-4 py-20 sm:px-6">
            <FaqList faqs={faqs} />
          </div>
        )}
      </main>

      <HomeMotion rootId={ROOT_ID} />
    </div>
  );
}
