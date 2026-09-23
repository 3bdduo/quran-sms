import Link from "next/link";
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";

const quickLinks = [
  { href: "/about", label: "عن المدرسة" },
  { href: "/curriculum", label: "المناهج" },
  { href: "/teachers", label: "المعلمون" },
  { href: "/blog", label: "المدونة" },
  { href: "/media", label: "المكتبة" },
  { href: "/contact", label: "تواصل معنا" },
];

export function Footer() {
  return (
    <footer className="bg-emerald-950 text-cream-100">
      <Container className="py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">ق</div>
            <p className="font-extrabold">مدرسة التربية بالقرآن الكريم</p>
          </div>
          <p className="text-cream-100/60 text-sm leading-relaxed">
            منصة تعليمية شاملة لتحفيظ القرآن الكريم وتدريس علومه، بمنهجية تربوية متكاملة ومتابعة مستمرة لكل طالب.
          </p>
        </div>

        <div>
          <p className="font-bold mb-4 text-cream-50">روابط سريعة</p>
          <ul className="space-y-2.5 text-sm">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-cream-100/60 hover:text-gold-400 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-bold mb-4 text-cream-50">تواصل معنا</p>
          <ul className="space-y-3 text-sm text-cream-100/60">
            <li className="flex items-center gap-2"><Phone size={16} className="text-gold-400" /> 01000000000</li>
            <li className="flex items-center gap-2"><Mail size={16} className="text-gold-400" /> info@quran-school.com</li>
            <li className="flex items-center gap-2"><MapPin size={16} className="text-gold-400" /> جمهورية مصر العربية</li>
          </ul>
        </div>

        <div>
          <p className="font-bold mb-4 text-cream-50">تابعونا</p>
          <div className="flex gap-3">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-900 hover:bg-emerald-600 transition-colors"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </Container>

      <div className="border-t border-cream-100/10 py-5">
        <Container className="text-center text-xs text-cream-100/50">
          © {new Date().getFullYear()} مدرسة التربية بالقرآن الكريم — جميع الحقوق محفوظة
        </Container>
      </div>
    </footer>
  );
}
