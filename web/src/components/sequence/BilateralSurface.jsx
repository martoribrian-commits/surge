import { CHROME_HEIGHT } from '../../brand/tokens';

/**
 * Left / right tap zones below chrome — bilateral sequences only.
 */
export default function BilateralSurface({ onLeftTap, onRightTap }) {
  const zoneClass =
    'absolute bottom-0 z-10 w-1/2 cursor-default border-0 bg-transparent outline-none';
  const zoneStyle = { top: CHROME_HEIGHT, WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' };

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 z-[9] border-b border-white/[0.04]"
        style={{ top: CHROME_HEIGHT, bottom: 0 }}
        aria-hidden
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/[0.06]" />
      </div>
      <button
        type="button"
        aria-label="Left anchor"
        className={`${zoneClass} left-0`}
        style={zoneStyle}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLeftTap?.();
        }}
      />
      <button
        type="button"
        aria-label="Right anchor"
        className={`${zoneClass} right-0`}
        style={zoneStyle}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRightTap?.();
        }}
      />
    </>
  );
}
