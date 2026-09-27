"use client";

import { useEffect } from "react";
import { RefreshCw, Home } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

// أي خطأ غير متوقع في أي صفحة (غير أخطاء الـ root layout نفسه) بيوصل هنا بدل ما يوري
// شاشة Next.js الافتراضية البيضا. لازم "use client" + يستقبل error و reset بالظبط كده.
export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // تقدر توصّل الخطأ هنا لأي أداة مراقبة أخطاء (Sentry مثلًا) لو حبيت تضيفها بعدين
        console.error(error);
    }, [error]);

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

                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">حصل خطأ غير متوقع</h1>
                <p className="mt-3 text-ink-soft max-w-md mx-auto leading-relaxed">
                    نعتذر عن الإزعاج — جرّب تحمّل الصفحة تاني، ولو المشكلة استمرت تواصل معانا.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button onClick={reset}>
                        <RefreshCw size={18} />
                        حاول تاني
                    </Button>
                    <ButtonLink href="/" variant="outline">
                        <Home size={18} />
                        الصفحة الرئيسية
                    </ButtonLink>
                </div>
            </Container>
        </div>
    );
}