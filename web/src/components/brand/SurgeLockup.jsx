import { Link } from 'react-router-dom';

const MARK_PATH =
  'M6 58 C14 56 22 50 30 34 C36 22 40 6 52 4 C64 2 70 34 80 48 C88 58 90 58 92 58 L134 58';
const VIEWBOX = '0 0 140 70';

const SIZES = {
  sm: { markW: 60, markH: 20, word: 16, rule: 16, gap: 8 },
  md: { markW: 110, markH: 34, word: 28, rule: 26, gap: 14 },
};

function Mark({ theme, width, height }) {
  const dotOuter = theme === 'light' ? '#0A0A0A' : '#F4F0EB';
  return (
    <svg
      width={width}
      height={height}
      viewBox={VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d={MARK_PATH}
        stroke="#B6502E"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="134" cy="58" r="3.5" fill={dotOuter} />
      <circle cx="134" cy="58" r="1.5" fill="#B6502E" />
    </svg>
  );
}

export default function SurgeLockup({ size = 'sm', theme = 'dark', href = '/' }) {
  const s = SIZES[size] ?? SIZES.sm;
  const wordColor = theme === 'light' ? '#0A0A0A' : '#F4F0EB';
  const ruleColor = theme === 'light' ? '#D4CFC9' : '#1E1E1E';

  const inner = (
    <>
      <Mark theme={theme} width={s.markW} height={s.markH} />
      <span className="shrink-0 self-center" style={{ width: 1, height: s.rule, background: ruleColor }} />
      <span
        className="font-extrabold leading-none tracking-[-0.03em]"
        style={{ fontSize: s.word, color: wordColor }}
      >
        Surge
      </span>
    </>
  );

  const className = `inline-flex items-center leading-none no-underline`;
  const style = { gap: s.gap };

  if (href) {
    return (
      <Link to={href} className={className} style={style} aria-label="Surge home">
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}

export { MARK_PATH, VIEWBOX };
