import { MD3Colors } from '@/lib/theme';
import type { HealthLevelId, ResolvedHealthLevel } from './types';

const LEVEL_BANDS: Array<Omit<ResolvedHealthLevel, 'color'> & { color: string }> = [
  { id: 'excellent', min: 95, max: 100, emoji: '🟢', color: MD3Colors.primaryFixedDim },
  { id: 'good', min: 85, max: 94, emoji: '🟢', color: MD3Colors.primaryFixedDim },
  { id: 'watch', min: 70, max: 84, emoji: '🟡', color: MD3Colors.tertiaryFixedDim },
  { id: 'advised', min: 50, max: 69, emoji: '🟠', color: '#FF9F43' },
  { id: 'urgent', min: 0, max: 49, emoji: '🔴', color: MD3Colors.error },
];

export function resolveHealthLevel(score: number): ResolvedHealthLevel {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band =
    LEVEL_BANDS.find((level) => clamped >= level.min && clamped <= level.max) ??
    LEVEL_BANDS[LEVEL_BANDS.length - 1];
  return band;
}

export function getHealthLevelTitleKey(id: HealthLevelId): string {
  return `vehicleHealth.levels.${id}.title`;
}

export function getHealthLevelDescriptionKey(id: HealthLevelId): string {
  return `vehicleHealth.levels.${id}.description`;
}
