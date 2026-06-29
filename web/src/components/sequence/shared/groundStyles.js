/** Static CSS backgrounds — always set via style, never animate-only (renders transparent on FM). */

export function shellGradient(palette) {
  return `linear-gradient(165deg, ${palette.background} 0%, ${palette.backgroundEnd ?? palette.background} 55%, ${palette.background} 100%)`;
}

export function previewGradient(palette) {
  return `linear-gradient(155deg, ${palette.background} 0%, ${palette.backgroundEnd ?? palette.background} 100%)`;
}

export function coherenceAuroraGradient(palette, index = 0) {
  const stops = [
    `radial-gradient(ellipse 100% 80% at 30% 20%, ${palette.accent}44 0%, transparent 50%), radial-gradient(ellipse 90% 70% at 70% 80%, ${palette.accentCalm}38 0%, transparent 55%), ${palette.background}`,
    `radial-gradient(ellipse 90% 75% at 65% 25%, ${palette.accentCalm}40 0%, transparent 52%), radial-gradient(ellipse 85% 65% at 35% 75%, ${palette.accent}36 0%, transparent 50%), ${palette.backgroundEnd ?? palette.background}`,
  ];
  return stops[index % stops.length];
}

export function vagalAuroraGradient(palette, index = 0) {
  const stops = [
    `radial-gradient(ellipse 90% 70% at 30% 35%, ${palette.accent}55 0%, transparent 52%), radial-gradient(ellipse 80% 60% at 72% 62%, ${palette.accentCalm}35 0%, transparent 50%), ${palette.background}`,
    `radial-gradient(ellipse 85% 65% at 68% 28%, ${palette.accentCalm}40 0%, transparent 48%), radial-gradient(ellipse 75% 55% at 32% 72%, ${palette.accent}42 0%, transparent 50%), ${palette.backgroundEnd ?? palette.background}`,
  ];
  return stops[index % stops.length];
}

export function orientingSkyGradient(palette, index = 0) {
  const stops = [
    `linear-gradient(180deg, ${palette.backgroundEnd} 0%, ${palette.background} 45%, #1a120c 100%)`,
    `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundEnd} 50%, #141a14 100%)`,
  ];
  return stops[index % stops.length];
}
