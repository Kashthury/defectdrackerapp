import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Path, G, Circle, Line, Text as SvgText, Polygon } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface DefectDensityMeterProps {
  defectDensity: number;
  klocInput: number;
  onKlocInputChange: (text: string) => void;
  onKlocUpdate: () => void;
  onCalculateClick: () => void;
  klocChanged: boolean;
  updating: boolean;
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

  let zoneColor = Colors.success;
  let zoneLabel = 'Low';
  if (density > 10) {
    zoneColor = Colors.error;
    zoneLabel = 'High';
  } else if (density > 7) {
    zoneColor = Colors.warning;
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
    { start: 0, end: 7, color: Colors.success },
    { start: 7, end: 10, color: Colors.warning },
    { start: 10, end: 15, color: Colors.error },
  ];

  const cx = 100;
  const cy = 100;
  const radius = 70;
  const strokeWidth = 16;

  const tip = polarToCartesian(cx, cy, radius - 6, angle);
  const baseRadius = 14;
  const baseLeft = polarToCartesian(cx, cy, baseRadius, angle - 90);
  const baseRight = polarToCartesian(cx, cy, baseRadius, angle + 90);
  const baseLeftNarrow = { x: (baseLeft.x + cx) / 2, y: (baseLeft.y + cy) / 2 };
  const baseRightNarrow = { x: (baseRight.x + cx) / 2, y: (baseRight.y + cy) / 2 };
  const needlePoints = `${tip.x},${tip.y} ${baseLeftNarrow.x},${baseLeftNarrow.y} ${baseRightNarrow.x},${baseRightNarrow.y}`;

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
            stroke={Colors.border}
            strokeWidth={strokeWidth}
          />
          {zones.map((zone) => (
            <Path
              key={zone.start}
              d={describeArc(cx, cy, radius, valueToAngle(zone.start), valueToAngle(zone.end))}
              fill="none"
              stroke={zone.color}
              strokeWidth={strokeWidth}
            />
          ))}
          <Polygon points={needlePoints} fill={Colors.text} />
          <Circle cx={cx} cy={cy} r={7} fill={Colors.text} />
        </Svg>
      </View>

      <View style={styles.inputRow}>
        <Text style={[Typography.overline, styles.klocLabel]}>KLOC</Text>
        <TextInput
          style={[Typography.body, styles.klocInput]}
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
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.updateIcon}>✓</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.calculateButton} onPress={onCalculateClick}>
          <Text style={[Typography.label, styles.calculateText]}>Calculate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 12, alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 8 },
  densityValue: { fontSize: 32, fontWeight: 'bold' },
  zoneLabel: { ...Typography.heading, fontSize: 18, marginLeft: 12 },
  svgWrapper: { marginVertical: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  klocLabel: { marginRight: 4, color: Colors.textSecondary },
  klocInput: {
    width: 65,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    textAlign: 'center',
    backgroundColor: Colors.white,
    color: Colors.text
  },
  updateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  updateActive: { backgroundColor: Colors.success },
  updateDisabled: { backgroundColor: Colors.borderStrong },
  updateIcon: { color: Colors.white, fontWeight: 'bold', fontSize: 20 },
  calculateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primarySoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primaryLight
  },
  calculateText: { color: Colors.primary, fontSize: 13, textTransform: 'none' },
});