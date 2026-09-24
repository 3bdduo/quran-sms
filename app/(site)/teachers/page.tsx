import type { Metadata } from "next";
import Image from "next/image";
import { GraduationCap, Award } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { teacherProfilesApi } from "@/lib/resources";

export const metadata: Metadata = { title: "المعلمون" };

export default async function TeachersPage() {
  const teachers = await teacherProfilesApi.list().catch(() => []);

  return (
    <div className="py-14 sm:py-24">
      <Container>
        <SectionHeading eyebrow="فريقنا التعليمي" title="تعرّف على معلمينا ومعلماتنا" />

        {teachers.length === 0 ? (
          <p className="text-center text-ink-mute mt-14">سيتم إضافة بيانات المعلمين قريبًا بإذن الله</p>
        ) : (
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {teachers.map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 0.1} className="h-full">
                <div className="group card-interactive h-full overflow-hidden text-center p-7 sm:p-8">
                  <div className="relative h-32 w-32 mx-auto rounded-full p-1.5 bg-linear-to-br from-gold via-brand to-brand-strong sh-lift transition-transform duration-[1300ms] group-hover:scale-105 group-hover:-rotate-3">
                    <div className="relative h-full w-full rounded-full overflow-hidden bg-brand-soft ring-4 ring-surface">
                      {t.photo_url ? (
                        <Image src={t.photo_url} alt={t.name} fill className="object-cover transition-transform duration-[1600ms] group-hover:scale-110" sizes="128px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-brand-ink/60">
                          <GraduationCap size={36} />
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-extrabold text-ink text-lg mt-5">{t.name}</h3>
                  {t.specialty && <p className="text-sm text-brand-ink font-bold mt-1">{t.specialty}</p>}

                  {t.ijazahs?.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                      {t.ijazahs.map((ij) => (
                        <span key={ij} className="inline-flex items-center gap-1 text-[11px] font-bold bg-gold-soft text-gold-ink px-2.5 py-1 rounded-full">
                          <Award size={11} /> {ij}
                        </span>
                      ))}
                    </div>
                  )}

                  {t.bio && <p className="text-sm text-ink-soft leading-relaxed mt-4">{t.bio}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
