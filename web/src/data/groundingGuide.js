/** Post-sequence grounding options with expanded guidance. */

export const GROUNDING_OPTIONS = [
  {
    id: 'cold',
    glyph: '◐',
    label: 'Cold water',
    hint: 'Face + wrists',
    steps: [
      'Splash cool water on your face, or hold a cold cloth to your wrists.',
      'Stay with the sensation for 20–30 seconds. Name temperature, not the story.',
      'Let your breath slow on its own before you move on.',
    ],
    craneSeed: 'I used cold water to ground after my sequence.',
  },
  {
    id: 'air',
    glyph: '◎',
    label: 'Fresh air',
    hint: '60 seconds outside',
    steps: [
      'Step outside or open a window. Feel air on skin.',
      'Notice one smell or temperature change without fixing anything.',
      'Stay until your shoulders drop even slightly.',
    ],
    craneSeed: 'I stepped outside for fresh air after the sequence.',
  },
  {
    id: 'see',
    glyph: '◉',
    label: 'Three objects',
    hint: 'Name without moving',
    steps: [
      'Pick three objects you can see from where you are.',
      'Name each out loud or in your head: color, shape, texture.',
      'Do not analyze. Just label what is in the room.',
    ],
    craneSeed: 'I named three objects in the room to orient after the sequence.',
  },
  {
    id: 'hands',
    glyph: '◌',
    label: 'Slow hands',
    hint: 'Tea, fold, texture',
    steps: [
      'Find something with texture: fabric, a mug, keys.',
      'Move slowly — pour, fold, or trace edges with one finger.',
      'Let your hands set the pace, not your thoughts.',
    ],
    craneSeed: 'I used slow hands with texture to stay present after the sequence.',
  },
];

export function getGroundingOption(id) {
  return GROUNDING_OPTIONS.find((g) => g.id === id) ?? null;
}
