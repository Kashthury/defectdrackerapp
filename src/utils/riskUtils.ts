export const getCombinedRisk = (
  remarkCategory: 'high' | 'medium' | 'low',
  densityRisk: 'high' | 'medium' | 'low',
  dsiRisk: 'high' | 'medium' | 'low'
): 'high' | 'medium' | 'low' => {
  if (remarkCategory === 'high' || densityRisk === 'high' || dsiRisk === 'high') {
    return 'high';
  }
  if (remarkCategory === 'medium' || densityRisk === 'medium' || dsiRisk === 'medium') {
    return 'medium';
  }
  return 'low';
};