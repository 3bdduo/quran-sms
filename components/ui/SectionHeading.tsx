interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "right";
}

export function SectionHeading({ eyebrow, title, description, align = "center" }: Props) {
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto" : "text-right max-w-2xl"}>
      {eyebrow && (
        <span className="inline-block text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full mb-4">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 leading-tight">{title}</h2>
      {description && <p className="mt-4 text-emerald-800/70 text-lg leading-relaxed">{description}</p>}
    </div>
  );
}
