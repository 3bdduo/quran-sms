"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, Radio, X, Video } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Loader } from "@/components/ui/Loader";
import { mediaApi } from "@/lib/resources";
import type { MediaItem } from "@/types";

const tracks = ["تحفيظ", "تفسير وتجويد", "علوم شرعية", "لغة عربية"];

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

  return (
    <div className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow="المكتبة" title="الفيديوهات والبث المباشر" />

        <div className="flex flex-wrap justify-center gap-2 mt-10">
          <button
            onClick={() => setTrack(undefined)}
            className={`px-4 py-2 rounded-full text-sm font-bold ${!track ? "bg-emerald-600 text-cream-50" : "bg-white text-emerald-900 border border-emerald-900/10"}`}
          >
            الكل
          </button>
          {tracks.map((t) => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={`px-4 py-2 rounded-full text-sm font-bold ${track === t ? "bg-emerald-600 text-cream-50" : "bg-white text-emerald-900 border border-emerald-900/10"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <p className="text-center text-emerald-900/50 mt-16">لا يوجد محتوى في هذا القسم حاليًا</p>
        ) : (
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item)}
                className="group text-right bg-white rounded-3xl overflow-hidden border border-emerald-900/5 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-44 bg-emerald-950">
                  {item.thumbnail_url ? (
                    <Image src={item.thumbnail_url} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" sizes="400px" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-emerald-700">
                      <Video size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle size={52} className="text-cream-50/90 group-hover:scale-110 transition-transform" />
                  </div>
                  {item.is_live && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                      <Radio size={11} /> بث مباشر
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{item.track}</span>
                  <h3 className="font-extrabold text-emerald-950 mt-3 leading-snug">{item.title}</h3>
                  {item.teacher_name && <p className="text-xs text-emerald-900/50 font-semibold mt-1">{item.teacher_name}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </Container>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-emerald-950/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black rounded-2xl overflow-hidden w-full max-w-3xl aspect-video relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActive(null)}
                className="absolute top-3 left-3 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
              <iframe src={active.video_url} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
