import Image from "next/image";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { teacherProfilesApi } from "@/lib/resources";

export async function TeachersPreview() {
  const teachers = await teacherProfilesApi.list().catch(() => []);
  const featured = teachers.slice(0, 4);

  return (
    <section className="py-20">
      <Container>
        <SectionHeading eyebrow="فريقنا" title="تعرّف على معلمينا" />

        {featured.length === 0 ? (
          <p className="text-center text-emerald-900/50 mt-10">سيتم إضافة بيانات المعلمين قريبًا بإذن الله</p>
        ) : (
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((t) => (
              <div key={t.id} className="text-center group">
                <div className="relative h-32 w-32 sm:h-40 sm:w-40 mx-auto rounded-full overflow-hidden bg-emerald-100 ring-4 ring-cream-50 shadow-lg">
                  {t.photo_url ? (
                    <Image src={t.photo_url} alt={t.name} fill className="object-cover" sizes="160px" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-emerald-400">
                      <GraduationCap size={40} />
                    </div>
                  )}
                </div>
                <p className="font-extrabold text-emerald-950 mt-4">{t.name}</p>
                {t.specialty && <p className="text-xs text-emerald-700 font-semibold mt-1">{t.specialty}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <ButtonLink href="/teachers" variant="outline">
            <ArrowLeft size={18} />
            كل المعلمين
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
