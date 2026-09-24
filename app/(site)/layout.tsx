import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { ScrollTopButton } from "@/components/ui/ScrollTopButton";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[60dvh]">{children}</main>
      <Footer />
      <ScrollTopButton />
    </>
  );
}
