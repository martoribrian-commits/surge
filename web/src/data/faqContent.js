/** FAQ content for /faq and marketing embeds. */

export const FAQ_CATEGORIES = [
  { id: 'general', label: 'General', icon: '◆' },
  { id: 'science', label: 'Science', icon: '◎' },
  { id: 'clinical', label: 'Clinical', icon: '⬡' },
  { id: 'privacy', label: 'Privacy', icon: '◇' },
];

export const FAQ_BY_CATEGORY = {
  general: [
    {
      q: 'Do I need an account?',
      a: 'No. Pick a sequence and begin. Clinical tokens are optional for Crane post-session support.',
    },
    {
      q: 'How long does a sequence take?',
      a: '30, 60, or 90 seconds. Fixed curve. Release to pause. Exit anytime.',
    },
    {
      q: 'Which sequence should I pick?',
      a: 'Match body state, not mood score. See the guide on How it works or ask Crane.',
    },
    {
      q: 'Do I need headphones?',
      a: 'Recommended for audio-heavy sequences. Visual downshift still works without them.',
    },
  ],
  science: [
    {
      q: 'Is Surge FDA-cleared?',
      a: 'No. Evidence-informed software built on named physiological protocols. Not a medical device.',
    },
    {
      q: 'What is a physiological sigh?',
      a: 'Double inhale plus extended exhale. Stanford RCT showed cyclic sigh improved mood vs mindfulness meditation.',
    },
    {
      q: 'Why fixed durations?',
      a: 'Under stress, open-ended tools add decisions. A fixed curve removes "Am I done yet?"',
    },
    {
      q: 'Where is the research?',
      a: 'See published studies on the home page and How it works. We cite sources, not hype.',
    },
  ],
  clinical: [
    {
      q: 'What data do providers see?',
      a: 'Token activation, completion, duration, sequence variant. No transcripts unless the patient shares them.',
    },
    {
      q: 'Can multiple clinicians share a portal?',
      a: 'Yes. Clinical and Enterprise tiers aggregate stats across your organization.',
    },
    {
      q: 'How do tokens work?',
      a: 'Six-character codes with expiry and use count. Patient enters once. No login.',
    },
    {
      q: 'Can I try it before prescribing?',
      a: 'Yes. Run any sequence from Start without a token.',
    },
  ],
  privacy: [
    {
      q: 'What leaves my device?',
      a: 'Nothing by default. Optional telemetry only with a clinical token and connectivity.',
    },
    {
      q: 'Are post-session notes stored?',
      a: 'Optional brain dump auto-deletes locally after 24 hours.',
    },
    {
      q: 'Does Crane train on my conversations?',
      a: 'No. Sovereignty guard blocks sensitive payloads from external sinks.',
    },
    {
      q: 'What happens at token validation?',
      a: 'Server returns valid or invalid only. No patient name. No provider name.',
    },
  ],
};

export const FAQ_QUICK = [
  { label: 'No account', value: '0' },
  { label: 'Seconds per cycle', value: '30-90' },
  { label: 'Sequences', value: '7' },
];
