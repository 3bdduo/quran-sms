import type { Metadata } from "next";
import Image from "next/image";
import { GraduationCap, Award } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { teacherProfilesApi } from "@/lib/resources";

export const metadata: Metadata = { title: "المعلمون" };

export default async function TeachersPage() {
  const teachers = await teacherProfilesApi.list().catch(() => []);

  return (
    <div className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="فريقنا التعليمي" title="تعرّف على معلمينا ومعلماتنا" />

        {teachers.length === 0 ? (
          <p className="text-center text-emerald-900/50 mt-14">سيتم إضافة بيانات المعلمين قريبًا بإذن الله</p>
        ) : (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.map((t) => (
              <div key={t.id} className="bg-white rounded-3xl border border-emerald-900/5 overflow-hidden text-center p-8 hover:shadow-xl hover:shadow-emerald-900/5 transition-shadow">
                <div className="relative h-32 w-32 mx-auto rounded-full overflow-hidden bg-emerald-100 ring-4 ring-cream-100">
                  {t.photo_url ? (
                    <Image src={t.photo_url} alt={t.name} fill className="object-cover" sizes="128px" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-emerald-400">
                      <GraduationCap size={36} />
                    </div>
                  )}
                </div>
                <h3 className="font-extrabold text-emerald-950 text-lg mt-5">{t.name}</h3>
                {t.specialty && <p className="text-sm text-emerald-700 font-bold mt-1">{t.specialty}</p>}

                {t.ijazahs?.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {t.ijazahs.map((ij) => (
                      <span key={ij} className="inline-flex items-center gap-1 text-[11px] font-bold bg-gold-400/15 text-gold-500 px-2.5 py-1 rounded-full">
                        <Award size={11} /> {ij}
                      </span>
                    ))}
                  </div>
                )}

                {t.bio && <p className="text-sm text-emerald-900/60 leading-relaxed mt-4">{t.bio}</p>}
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
