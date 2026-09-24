"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { PlayCircle, Radio, X, Video } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Loader } from "@/components/ui/Loader";
import { Reveal } from "@/components/ui/Reveal";
import { mediaApi } from "@/lib/resources";
import type { MediaItem } from "@/types";

const tracks = ["تحفيظ", "تفسير وتجويد", "علوم شرعية"];

const chip = (active: boolean) =>
  `relative px-4 min-h-11 inline-flex items-center rounded-full text-sm font-bold transition-all duration-[1000ms] active:scale-95 ${
    active
      ? "bg-brand text-on-brand sh-brand"
      : "bg-surface text-ink-soft border border-line sh-soft hover:border-brand hover:text-brand-ink"
  }`;

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<string | undefined>(undefined);
  const [active, setActive] = useState<MediaItem | null>(null);

  useEffect(() => {
    setLoading(true);
    mediaApi
      .list(track)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [track]);

  // منع سكرول الصفحة والفيديو مفتوح
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <div className="py-14 sm:py-24">
      <Container>
        <SectionHeading eyebrow="المكتبة" title="الفيديوهات والبث المباشر" />

        <Reveal delay={0.1} className="flex flex-wrap justify-center gap-2.5 mt-10">
          <button onClick={() => setTrack(undefined)} className={chip(!track)}>
            الكل
          </button>
          {tracks.map((t) => (
            <button key={t} onClick={() => setTrack(t)} className={chip(track === t)}>
              {t}
            </button>
          ))}
        </Reveal>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <p className="text-center text-ink-mute mt-16">لا يوجد محتوى في هذا القسم حاليًا</p>
        ) : (
          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {items.map((item, i) => (
              <Reveal key={item.id} delay={(i % 3) * 0.08} className="h-full">
                <button
                  onClick={() => setActive(item)}
                  className="group card-interactive w-full h-full text-start overflow-hidden flex flex-col"
                >
                  <div className="relative h-44 sm:h-48 bg-deep overflow-hidden">
                    {item.thumbnail_url ? (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        fill
                        className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[1600ms]"
                        sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-on-deep-soft">
                        <Video size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="grid place-items-center h-16 w-16 rounded-full bg-white/25 border border-white/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] group-hover:scale-110 group-hover:bg-brand group-hover:text-on-brand transition-all duration-[1300ms]">
                        <PlayCircle size={34} />
                      </span>
                    </div>
                    {item.is_live && (
                      <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-danger-solid text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                        </span>
                        <Radio size={11} /> بث مباشر
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1">
                    <span className="text-[11px] font-bold text-brand-ink bg-brand-soft px-2.5 py-1 rounded-full">{item.track}</span>
                    <h3 className="font-extrabold text-ink mt-3 leading-snug">{item.title}</h3>
                    {item.teacher_name && <p className="text-xs text-ink-mute font-semibold mt-1">{item.teacher_name}</p>}
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </Container>

      <AnimatePresence>
        {active && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
          >
            <m.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 135, damping: 22 }}
              className="bg-black rounded-2xl sm:rounded-3xl overflow-hidden w-full max-w-3xl aspect-video relative sh-float"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActive(null)}
                aria-label="إغلاق"
                className="absolute top-3 left-3 z-10 h-10 w-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
              <iframe src={active.video_url} title={active.title} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
