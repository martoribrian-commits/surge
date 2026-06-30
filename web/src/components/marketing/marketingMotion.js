/** Shared Framer Motion presets for marketing pages. */
export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
};

export const stagger = (index, step = 0.06) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: index * step },
});
