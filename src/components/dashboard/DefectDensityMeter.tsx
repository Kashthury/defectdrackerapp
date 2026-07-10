import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Path, G, Circle, Line, Text as SvgText, Polygon } from 'react-native-svg';

interface DefectDensityMeterProps {
  defectDensity: number;
  klocInput: number;
  onKlocInputChange: (text: string) => void;
  onKlocUpdate: () => void;
  onCalculateClick: () => void;
  klocChanged: boolean;
  updating: boolean; // required, not optional
}

export const DefectDensityMeter: React.FC<DefectDensityMeterProps> = ({
  defectDensity,
  klocInput,
  onKlocInputChange,
  onKlocUpdate,
  onCalculateClick,
  klocChanged,
  updating,
}) => {
  const density = Math.max(0, Math.min(defectDensity, 15));
  const valueToAngle = (value: number) => -90 + (value / 15) * 180;
  const angle = valueToAngle(density);

  let zoneColor = '#22c55e';
  let zoneLabel = 'Low';
  if (density > 10) {
    zoneColor = '#ef4444';
    zoneLabel = 'High';
  } else if (density > 7) {
    zoneColor = '#facc15';
    zoneLabel = 'Medium';
  }

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const zones = [
    { start: 0, end: 7, color: '#22c55e' },
    { start: 7, end: 10, color: '#facc15' },
    { start: 10, end: 15, color: '#ef4444' },
  ];

  const cx = 100;
  const cy = 100;
  const radius = 70;
  const strokeWidth = 16;

  // Needle triangle
  const tip = polarToCartesian(cx, cy, radius - 6, angle);
  const baseRadius = 14;
  const baseLeft = polarToCartesian(cx, cy, baseRadius, angle - 90);
  const baseRight = polarToCartesian(cx, cy, baseRadius, angle + 90);
  const baseLeftNarrow = { x: (baseLeft.x + cx) / 2, y: (baseLeft.y + cy) / 2 };
  const baseRightNarrow = { x: (baseRight.x + cx) / 2, y: (baseRight.y + cy) / 2 };
  const needlePoints = `${tip.x},${tip.y} ${baseLeftNarrow.x},${baseLeftNarrow.y} ${baseRightNarrow.x},${baseRightNarrow.y}`;

  // ✅ Button disabled if NO change OR currently updating
  const isButtonDisabled = !klocChanged || updating;

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text style={[styles.densityValue, { color: zoneColor }]}>
          {defectDensity.toFixed(2)}
        </Text>
        <Text style={[styles.zoneLabel, { color: zoneColor }]}>
          {zoneLabel}
        </Text>
      </View>

      <View style={styles.svgWrapper}>
        <Svg width="200" height="120" viewBox="0 0 200 120">
          <Path
            d={describeArc(cx, cy, radius, valueToAngle(0), valueToAngle(15))}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {zones.map((zone) => {
            if (zone.start === zone.end) return null;
            return (
              <Path
                key={zone.start}
                d={describeArc(cx, cy, radius, valueToAngle(zone.start), valueToAngle(zone.end))}
                fill="none"
                stroke={zone.color}
                strokeWidth={strokeWidth}
              />
            );
          })}
          <Polygon points={needlePoints} fill="#1e293b" />
          <Circle cx={cx} cy={cy} r={7} fill="#1e293b" />
          {[0, 7, 10].map((tick) => {
            const tickAngle = valueToAngle(tick);
            const start = polarToCartesian(cx, cy, radius, tickAngle);
            const end = polarToCartesian(cx, cy, radius + 10, tickAngle);
            const labelPos = polarToCartesian(cx, cy, radius + 22, tickAngle);
            return (
              <G key={tick}>
                <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#64748b" strokeWidth="2" />
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y + 4}
                  fontSize="12"
                  fill="#64748b"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {tick}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.klocLabel}>KLOC:</Text>
        <TextInput
          style={styles.klocInput}
          keyboardType="decimal-pad"
          value={klocInput.toString()}
          onChangeText={onKlocInputChange}
        />
        <TouchableOpacity
          style={[
            styles.updateButton,
            isButtonDisabled ? styles.updateDisabled : styles.updateActive,
          ]}
          onPress={onKlocUpdate}
          disabled={isButtonDisabled}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.updateIcon}>✓</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.calculateButton} onPress={onCalculateClick}>
          <Text style={styles.calculateText}>Calculate KLOC</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 8, alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 4 },
  densityValue: { fontSize: 28, fontWeight: 'bold' },
  zoneLabel: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
  svgWrapper: { marginVertical: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  klocLabel: { fontSize: 14, fontWeight: '500', color: '#475569', marginRight: 8 },
  klocInput: { width: 60, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, fontSize: 14, textAlign: 'center', backgroundColor: '#fff' },
  updateButton: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, minWidth: 36, alignItems: 'center' },
  updateActive: { backgroundColor: '#22c55e' },
  updateDisabled: { backgroundColor: '#94a3b8' },
  updateIcon: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  calculateButton: { marginLeft: 12, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#e0f2fe', borderRadius: 20, borderWidth: 1, borderColor: '#38bdf8' },
  calculateText: { color: '#0284c7', fontWeight: '600', fontSize: 13 },
});