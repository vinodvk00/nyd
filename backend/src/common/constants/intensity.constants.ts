export const INTENSITY_TAGS = [
  'passive',
  'active',
  'shallow',
  'deep',
  'peak',
  'breakthrough',
  'flow',
] as const;

export type IntensityLevel = (typeof INTENSITY_TAGS)[number];

// Display order (low to high cognitive load)
export const INTENSITY_ORDER: IntensityLevel[] = [
  'passive',
  'active',
  'shallow',
  'deep',
  'peak',
  'breakthrough',
  'flow',
];

// Descriptions for UI
export const INTENSITY_DESCRIPTIONS: Record<IntensityLevel, string> = {
  passive: 'Passive consumption - reading, watching without notes',
  active: 'Active consumption - reading with notes, following tutorials',
  shallow: 'Shallow creation - familiar code, implementing from specs',
  deep: 'Deep work - building from scratch, complex debugging',
  peak: 'Peak challenge - system design, hard problems, max 2-3h/day',
  breakthrough: 'Breakthrough mode - solving beyond normal capacity',
  flow: 'Flow state - effortless high performance, cannot be forced',
};
