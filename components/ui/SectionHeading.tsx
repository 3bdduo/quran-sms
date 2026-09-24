"use client";

import { m } from "framer-motion";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "right";
  /** "onDeep" لما العنوان يبقى فوق خلفية غامقة (deep) */
  tone?: "default" | "onDeep";
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function SectionHeading({ eyebrow, title, description, align = "center", tone = "default" }: Props) {
  const center = align === "center";
  const deep = tone === "onDeep";
  return (
    <div className={center ? "text-center max-w-2xl mx-auto" : "text-right max-w-2xl"}>
      {eyebrow && (
        <m.span
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: EASE }}
          className={`inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4 ${deep ? "bg-on-deep/10 text-gold border border-deep-line" : "bg-brand-soft text-brand-ink sh-soft"}`}
        >
          {eyebrow}
        </m.span>
      )}

      <m.h2
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.1, ease: EASE }}
        className={`font-ruqaa font-bold text-[clamp(2rem,5.2vw,3.4rem)] leading-[1.65] text-balance ${deep ? "text-on-deep" : "text-ink"}`}
      >
        {title}
      </m.h2>

      <m.span
        aria-hidden="true"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.35, delay: 0.3, ease: EASE }}
        className={`mt-2 flex items-center gap-2 ${center ? "justify-center" : "justify-start"} text-gold`}
      >
        <span className="h-px w-10 bg-linear-to-l from-transparent to-gold" />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        </svg>
        <span className="h-px w-10 bg-linear-to-r from-transparent to-gold" />
      </m.span>

      {description && (
        <m.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.05, delay: 0.36, ease: EASE }}
          className={`mt-5 text-base sm:text-lg leading-relaxed ${deep ? "text-on-deep-soft" : "text-ink-soft"}`}
        >
          {description}
        </m.p>
      )}
    </div>
  );
}
