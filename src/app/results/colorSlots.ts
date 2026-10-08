/**
 * colorSlots.ts
 * 3-slot color palette for the results screen.
 * Colors are deterministic — assigned by admin per candidate via system_config `candidate_colors`.
 * Reused across jabatan since only one jabatan is shown at a time.
 */

export type ColorSlot = 'A' | 'B' | 'C';

export interface SlotColors {
  fill: string;       // balloon body / bar fill
  shine: string;      // balloon highlight ellipse
  string: string;     // balloon string stroke
  knot: string;       // balloon tie knot (slightly darker)
  legend: string;     // legend dot
  barGray: string;    // bar chart color in session mode (always same)
}

export const COLOR_SLOTS: Record<ColorSlot, SlotColors> = {
  A: {
    fill: '#1e3a5f',    // brand-navy-700
    shine: '#3d619b',
    string: '#94a3b8',
    knot: '#1b2c49',
    legend: '#1e3a5f',
    barGray: '#94a3b8',
  },
  B: {
    fill: '#f59e0b',    // brand-amber-500
    shine: '#fcd34d',
    string: '#94a3b8',
    knot: '#b45309',
    legend: '#f59e0b',
    barGray: '#94a3b8',
  },
  C: {
    fill: '#10b981',    // brand-emerald-500
    shine: '#6ee7b7',
    string: '#94a3b8',
    knot: '#047857',
    legend: '#10b981',
    barGray: '#94a3b8',
  },
};

export const SLOT_ORDER: ColorSlot[] = ['A', 'B', 'C'];

/** Gray used for bar chart in session mode */
export const SESSION_BAR_COLOR = '#94a3b8';

/**
 * Resolves a candidate's color slot.
 * candidateColors: Record<candidateId, ColorSlot> from system_config.
 * Falls back to ordinal slot (index 0→A, 1→B, 2→C).
 */
export function resolveSlot(
  candidateId: string,
  ordinalIndex: number,
  candidateColors: Record<string, ColorSlot>
): ColorSlot {
  if (candidateColors[candidateId]) return candidateColors[candidateId];
  return SLOT_ORDER[ordinalIndex % SLOT_ORDER.length];
}

/** Parse the candidate_colors JSON string from system_config safely. */
export function parseCandidateColors(raw: string | undefined): Record<string, ColorSlot> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, ColorSlot>;
  } catch {
    // malformed JSON — return empty, fallback to ordinal
  }
  return {};
}

/** Human-readable jabatan label for the header. */
export const JABATAN_LABELS: Record<string, string> = {
  ketua: 'Ketua OSIS 2025/2026',
  wakil_1: 'Wakil Ketua 1 OSIS 2025/2026',
  wakil_2: 'Wakil Ketua 2 OSIS 2025/2026',
};
