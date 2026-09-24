import Image from "next/image";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { teacherProfilesApi } from "@/lib/resources";

export async function TeachersPreview() {
  const teachers = await teacherProfilesApi.list().catch(() => []);
  const featured = teachers.slice(0, 4);

  return (
    <section className="cv-auto py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="فريقنا" title="تعرّف على معلمينا" />

        {featured.length === 0 ? (
          <p className="text-center text-ink-mute mt-10">سيتم إضافة بيانات المعلمين قريبًا بإذن الله</p>
        ) : (
          <div className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-8">
            {featured.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.09} className="text-center group">
                <div className="relative mx-auto h-28 w-28 sm:h-36 sm:w-36 lg:h-40 lg:w-40 rounded-full p-1.5 bg-linear-to-br from-gold via-brand to-brand-strong sh-lift transition-transform duration-[1300ms] group-hover:scale-105 group-hover:-rotate-3">
                  <div className="relative h-full w-full rounded-full overflow-hidden bg-brand-soft ring-4 ring-surface">
                    {t.photo_url ? (
                      <Image src={t.photo_url} alt={t.name} fill className="object-cover transition-transform duration-[1600ms] group-hover:scale-110" sizes="(min-width: 1024px) 160px, (min-width: 640px) 144px, 112px" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-brand-ink/60">
                        <GraduationCap size={40} />
                      </div>
                    )}
                  </div>
                </div>
                <p className="font-extrabold text-ink mt-5">{t.name}</p>
                {t.specialty && <p className="text-xs sm:text-sm text-brand-ink font-semibold mt-1">{t.specialty}</p>}
              </Reveal>
            ))}
          </div>
        )}

        <Reveal className="mt-12 text-center">
          <ButtonLink href="/teachers" variant="outline">
            <ArrowLeft size={18} />
            كل المعلمين
          </ButtonLink>
        </Reveal>
      </Container>
    </section>
  );
}
