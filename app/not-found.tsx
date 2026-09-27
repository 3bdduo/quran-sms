import type { Metadata } from "next";
import { Home } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = { title: "الصفحة غير موجودة" };

// صفحة 404 — بتظهر لأي رابط مش موجود في الموقع كله (الصفحات العامة ولوحة التحكم).
// عملناها مستقلة بتصميمها (مش معتمدة على Header/Footer) عشان تشتغل صح في أي مكان في الموقع.
export default function NotFound() {
    return (
        <div className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-linear-to-b from-[var(--hero-from)] via-bg to-bg py-16">
            <div
                aria-hidden="true"
                className="absolute inset-0 pattern-star opacity-[0.14] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_72%)]"
            />

            <Container className="relative text-center">
                <div className="mb-8 flex justify-center">
                    <Logo size="lg" />
                </div>

                <p className="font-ruqaa font-bold text-brand-ink text-[clamp(4rem,14vw,8rem)] leading-none">٤٠٤</p>

                <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-ink">
                    الصفحة اللي بتدوّر عليها مش موجودة
                </h1>
                <p className="mt-3 text-ink-soft max-w-md mx-auto leading-relaxed">
                    ممكن يكون اللينك اتغيّر أو انتقل لمكان تاني. جرّب ترجع للصفحة الرئيسية أو تتواصل معانا.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <ButtonLink href="/">
                        <Home size={18} />
                        الصفحة الرئيسية
                    </ButtonLink>
                    <ButtonLink href="/contact" variant="outline">
                        تواصل معنا
                    </ButtonLink>
                </div>
            </Container>
        </div>
    );
}