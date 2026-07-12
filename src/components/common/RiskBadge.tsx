import React from 'react';
import { Chip } from './Chip';
import { getRiskMeta } from '../../utils/colorUtils';
import { Colors } from '../../constants/colors';
import type { RiskLevel } from '../../utils/riskUtils';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  /** Solid (default) reads as a status pill; soft is lighter for dense UIs. */
  variant?: 'solid' | 'soft';
  /** Neutral placeholder shown while the risk is still being computed. */
  loading?: boolean;
}

/**
 * Canonical risk pill used across the app. Color, icon and label all come from
 * the single risk color scheme in colorUtils.getRiskMeta.
 */
const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md', variant = 'solid', loading = false }) => {
  if (loading) {
    return (
      <Chip label="Assessing…" color={Colors.textSecondary} icon="loader" variant="soft" size={size} />
    );
  }
  const meta = getRiskMeta(risk);
  return <Chip label={meta.label} color={meta.color} icon={meta.icon} variant={variant} size={size} />;
};

export default RiskBadge;
