import Link from "next/link";
import { Phone, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { Reveal } from "@/components/ui/Reveal";

const quickLinks = [
  { href: "/about", label: "عن المدرسة" },
  { href: "/curriculum", label: "المناهج" },
  { href: "/blog", label: "المدونة" },
  { href: "/media", label: "المكتبة" },
  { href: "/contact", label: "تواصل معنا" },
];



export function Footer() {
  return (
    <footer className="cv-auto relative bg-deep text-on-deep overflow-hidden shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.45)]">
      {/* خط ذهبي متدرج أعلى الفوتر */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 pattern-star opacity-[0.05]" />

      <Container className="relative py-14 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <Reveal>
          <div className="mb-4">
            <Logo size="md" tone="onDeep" />
          </div>
          <p className="text-on-deep-soft text-sm leading-relaxed max-w-xs">
            منصة تعليمية شاملة لتحفيظ القرآن الكريم وتدريس علومه، بمنهجية تربوية متكاملة ومتابعة مستمرة لكل طالب.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="font-bold mb-4 text-on-deep text-lg">روابط سريعة</p>
          <ul className="space-y-1 text-sm">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-9 items-center text-on-deep-soft hover:text-gold hover:-translate-x-1 transition-all duration-[1000ms]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="font-bold mb-4 text-on-deep text-lg">تواصل معنا</p>
          <ul className="space-y-3.5 text-sm text-on-deep-soft">
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="text-gold shrink-0" />
              <span dir="ltr">01120449993</span>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin size={16} className="text-gold shrink-0" />
              مصر , بني سويف , اهناسيا , قرية النويرة
            </li>
          </ul>
        </Reveal>


      </Container>

      <div className="relative border-t border-deep-line py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <Container className="text-center text-xs text-on-deep-soft">
          © {new Date().getFullYear()} مدرسة التربية بالقرآن الكريم — جميع الحقوق محفوظة
        </Container>
      </div>
    </footer>
  );
}
