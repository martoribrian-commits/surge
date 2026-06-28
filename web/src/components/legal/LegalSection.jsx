/**
 * Scannable legal section — label, title, body slots.
 */
export default function LegalSection({ id, label, title, children }) {
  return (
    <section id={id} className="scroll-mt-8">
      {label ? (
        <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-[#B6502E]">
          {label}
        </p>
      ) : null}
      {title ? (
        <h2 className="mb-5 font-sans text-lg font-semibold tracking-[0.04em] text-[#F4F0EB] md:text-xl">
          {title}
        </h2>
      ) : null}
      <div className="space-y-4">{children}</div>
      <hr className="my-12 border-0 border-t border-white/[0.06]" />
    </section>
  );
}

export function LegalParagraph({ children }) {
  return (
    <p className="font-sans text-[15px] font-normal leading-[1.75] tracking-[0.01em] text-white/55">
      {children}
    </p>
  );
}

export function LegalList({ items }) {
  return (
    <ul className="ml-0 list-none space-y-2 pl-0">
      {items.map((item) => (
        <li
          key={item}
          className="relative pl-4 font-sans text-[15px] leading-[1.7] text-white/50 before:absolute before:left-0 before:top-[0.65em] before:h-px before:w-2 before:bg-[#B6502E]/60"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
