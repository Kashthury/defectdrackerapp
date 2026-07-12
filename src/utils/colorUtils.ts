import { Colors } from '../constants/colors';
import type { RiskLevel } from './riskUtils';

/**
 * Color helpers used across the UI so that:
 *  - backend-provided color codes (severity/priority/status) render safely,
 *  - tints/alpha are computed correctly for any color format, and
 *  - the risk color scheme lives in exactly one place.
 */

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const expandHex = (hex: string): string => {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length === 8) {
    // Drop existing alpha, we re-apply our own.
    h = h.slice(0, 6);
  }
  return h;
};

const parseRgb = (color: string): { r: number; g: number; b: number } | null => {
  if (!color) return null;
  const c = color.trim();

  if (c.startsWith('#')) {
    const h = expandHex(c);
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  const rgbMatch = c.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => parseFloat(p.trim()));
    if (parts.length >= 3) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }
  return null;
};

/**
 * Returns `color` with the given alpha (0..1). Works for #rgb, #rrggbb,
 * #rrggbbaa and rgb()/rgba() inputs. Falls back to the original color when it
 * can't be parsed (e.g. named colors), so it never crashes on backend data.
 */
export const withAlpha = (color: string, alpha: number): string => {
  const rgb = parseRgb(color);
  if (!rgb) return color;
  const a = clamp(alpha, 0, 1);
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${a})`;
};

/** True when a value looks like a usable CSS/RN color string. */
export const isValidColor = (color?: string | null): color is string => {
  if (!color || typeof color !== 'string') return false;
  const c = color.trim();
  if (!c) return false;
  if (c.startsWith('#')) {
    const h = c.replace('#', '');
    return [3, 6, 8].includes(h.length) && !/[^0-9a-fA-F]/.test(h);
  }
  return /^rgba?\(/i.test(c) || /^[a-zA-Z]+$/.test(c);
};

/**
 * Picks readable text (near-black or white) for a given background color using
 * relative luminance.
 */
export const getContrastText = (bg: string): string => {
  const rgb = parseRgb(bg);
  if (!rgb) return Colors.text;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? Colors.text : Colors.white;
};

// ---------------------------------------------------------------------------
// Risk color scheme (single source of truth — was duplicated in ~6 files).
// ---------------------------------------------------------------------------

export interface RiskMeta {
  color: string;
  bg: string;
  border: string;
  label: string;
  icon: string;
}

export const getRiskColor = (risk: RiskLevel): string => {
  switch (risk) {
    case 'high':
      return Colors.error;
    case 'medium':
      return Colors.warning;
    default:
      return Colors.success;
  }
};

export const getRiskMeta = (risk: RiskLevel): RiskMeta => {
  switch (risk) {
    case 'high':
      return {
        color: Colors.error,
        bg: Colors.errorBg,
        border: Colors.errorBorder,
        label: 'High Risk',
        icon: 'alert-octagon',
      };
    case 'medium':
      return {
        color: Colors.warning,
        bg: Colors.warningBg,
        border: Colors.warningBorder,
        label: 'Medium Risk',
        icon: 'alert-triangle',
      };
    default:
      return {
        color: Colors.success,
        bg: Colors.successBg,
        border: Colors.successBorder,
        label: 'Low Risk',
        icon: 'check-circle',
      };
  }
};

// ---------------------------------------------------------------------------
// Severity / priority color resolution.
//
// Preference order:
//   1. An explicit color code from the backend (severity.color / priority.color).
//   2. A deterministic color derived from well-known severity/priority names.
//   3. A stable hashed hue, so even unknown labels get a distinct, consistent
//      color instead of all collapsing to one neutral tone.
// ---------------------------------------------------------------------------

const NAME_COLOR_MAP: Record<string, string> = {
  // Highest / most severe
  blocker: '#7F1D1D',
  showstopper: '#7F1D1D',
  fatal: '#7F1D1D',
  critical: '#B91C1C',
  // High
  high: '#DC2626',
  major: '#DC2626',
  urgent: '#E11D48',
  severe: '#DC2626',
  // Medium
  medium: '#D97706',
  moderate: '#D97706',
  normal: '#CA8A04',
  average: '#D97706',
  // Low
  low: '#16A34A',
  minor: '#0891B2',
  trivial: '#0D9488',
  cosmetic: '#0D9488',
  info: '#0284C7',
  lowest: '#16A34A',
};

const hslToHex = (h: number, s: number, l: number): string => {
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hashHue = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 360;
  }
  return hash;
};

/**
 * Resolves the display color for a severity/priority (or any labeled entity).
 * Always returns a readable, chip-friendly color.
 */
export const resolveChipColor = (explicitColor?: string | null, name?: string | null): string => {
  if (isValidColor(explicitColor)) return explicitColor.trim();

  const key = (name || '').toLowerCase().trim();
  if (key && NAME_COLOR_MAP[key]) return NAME_COLOR_MAP[key];

  // Partial keyword match ("High Priority", "Critical Bug", etc.)
  for (const word of Object.keys(NAME_COLOR_MAP)) {
    if (key.includes(word)) return NAME_COLOR_MAP[word];
  }

  if (!key) return Colors.textSecondary;

  // Deterministic, stable fallback so unknown labels stay visually distinct.
  return hslToHex(hashHue(key), 62, 42);
};

/**
 * Builds an id -> color lookup from a backend list of severities/priorities so
 * cards can resolve a color even when the item itself doesn't carry one.
 */
export const buildColorMap = (
  items: any[],
  idKey = 'id',
): Record<string, string> => {
  const map: Record<string, string> = {};
  (items || []).forEach((item) => {
    if (!item) return;
    const id = item[idKey] ?? item.severityId ?? item.priorityId;
    const color =
      item.color ?? item.colorCode ?? item.severityColor ?? item.priorityColor ?? item.hexCode;
    if (id != null && isValidColor(color)) {
      map[String(id)] = color.trim();
    }
  });
  return map;
};
