export type RiskLevel = 'high' | 'medium' | 'low';

/**
 * Combines the risk of each underlying metric into a single project-level risk.
 * Highest risk wins: if any metric is high (High/Critical), the project is
 * high; otherwise if any is medium, it's medium; only when every metric is in
 * the lowest band is the project low.
 */
export const getCombinedRisk = (
  remarkCategory: RiskLevel,
  densityRisk: RiskLevel,
  dsiRisk: RiskLevel,
): RiskLevel => {
  if (remarkCategory === 'high' || densityRisk === 'high' || dsiRisk === 'high') {
    return 'high';
  }
  if (remarkCategory === 'medium' || densityRisk === 'medium' || dsiRisk === 'medium') {
    return 'medium';
  }
  return 'low';
};

/**
 * Defect Density risk bands (defects per KLOC).
 * Mirrors the thresholds used on the Project Detail screen.
 */
export const getDensityRisk = (density: number): RiskLevel => {
  if (density >= 10) return 'high';
  if (density >= 7) return 'medium';
  return 'low';
};

/**
 * Defect Severity Index risk, derived from the backend status label.
 * "Critical" / "High Risk" => high, "Needs Attention" => medium, else low.
 * Matching is case-insensitive and substring-based to tolerate minor label
 * variations from the backend.
 */
export const getDsiRisk = (dsiStatus: string): RiskLevel => {
  const s = (dsiStatus || '').toLowerCase();
  if (s.includes('critical') || s.includes('high')) return 'high';
  if (s.includes('attention') || s.includes('moderate') || s.includes('medium')) return 'medium';
  return 'low';
};

/**
 * Defect-to-Remark ratio risk, derived from the backend status label
 * ("High" / "Medium" / "Low"). Case-insensitive and substring-based.
 */
export const getRemarkRisk = (ratioStatus: string): RiskLevel => {
  const s = (ratioStatus || '').toLowerCase();
  if (s.includes('high') || s.includes('critical')) return 'high';
  if (s.includes('medium') || s.includes('moderate')) return 'medium';
  return 'low';
};

/**
 * Convenience helper: combine the three raw metric readings (defect density
 * value, DSI status label, remark ratio status label) into one project risk.
 */
export const getProjectRiskFromMetrics = (metrics: {
  defectDensity?: number;
  dsiStatus?: string;
  remarkStatus?: string;
}): RiskLevel =>
  getCombinedRisk(
    getRemarkRisk(metrics.remarkStatus ?? ''),
    getDensityRisk(metrics.defectDensity ?? 0),
    getDsiRisk(metrics.dsiStatus ?? ''),
  );
