import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Circle, Path, G, Text as SvgText, Line } from 'react-native-svg';

// ----- Defect Density Meter (SVG) -----
const DefectDensityMeter: React.FC<{ density: number }> = ({ density }) => {
  const needleRef = useRef<any>(null);

  const min = 0,
    max = 15;
  const cappedDensity = Math.max(min, Math.min(density, max));
  const angle = -90 + (cappedDensity / 15) * 180;

  useEffect(() => {
    if (needleRef.current) {
      needleRef.current.setNativeProps({
        transform: [{ rotate: `${angle}deg` }],
      });
    }
  }, [angle]);

  const getZoneColor = (val: number) => {
    if (val <= 7) return '#22c55e';
    if (val <= 10) return '#facc15';
    return '#ef4444';
  };
  const zoneColor = getZoneColor(density);

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startVal: number, endVal: number) => {
    const valueToAngle = (v: number) => -90 + (v / 15) * 180;
    const startAngle = valueToAngle(startVal);
    const endAngle = valueToAngle(endVal);
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const arcGreen = describeArc(100, 100, 70, 0, 7);
  const arcYellow = describeArc(100, 100, 70, 7.1, 10);
  const arcRed = describeArc(100, 100, 70, 10.1, 15);
  const arcBg = describeArc(100, 100, 70, 0, 15);

  const ticks = [0, 7, 10];
  const tickAngles = ticks.map((v) => -90 + (v / 15) * 180);
  const tickRadius = 80;
  const tickLabelRadius = 95;

  return (
    <View style={styles.meterContainer}>
      <View style={styles.meterWrapper}>
        <Svg height="140" width="200" viewBox="0 0 200 140">
          <Path d={arcBg} fill="none" stroke="#e5e7eb" strokeWidth="18" />
          <Path d={arcGreen} fill="none" stroke="#22c55e" strokeWidth="14" />
          <Path d={arcYellow} fill="none" stroke="#facc15" strokeWidth="14" />
          <Path d={arcRed} fill="none" stroke="#ef4444" strokeWidth="14" />

          <G transform={`rotate(${angle}, 100, 100)`}>
            <Path
              ref={needleRef}
              d="M100,35 L97,100 L103,100 Z"
              fill="#334155"
            />
          </G>
          <Circle cx="100" cy="100" r="7" fill="#334155" />

          {ticks.map((tick, i) => {
            const a = tickAngles[i];
            const start = polarToCartesian(100, 100, tickRadius, a);
            const end = polarToCartesian(100, 100, tickRadius + 8, a);
            const labelPos = polarToCartesian(100, 100, tickLabelRadius, a);
            return (
              <G key={tick}>
                <Line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#64748b"
                  strokeWidth="2"
                />
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y + 5}
                  fontSize="12"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {tick}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
      <Text style={[styles.densityValue, { color: zoneColor }]}>
        {isNaN(density) ? '0.00' : density.toFixed(2)}
      </Text>
    </View>
  );
};

// ----- Main Component -----
interface DefectDensityCardProps {
  density: number;
  kloc: number;
  loading: boolean;
  klocInput: string;
  onKlocInputChange: (value: string) => void;
  onKlocUpdate: () => void;
  onCalculatePress: () => void;
  klocChanged: boolean;
}

const DefectDensityCard: React.FC<DefectDensityCardProps> = ({
  density,
  kloc,
  loading,
  klocInput,
  onKlocInputChange,
  onKlocUpdate,
  onCalculatePress,
  klocChanged,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Defect Density</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#2563eb" />
      ) : (
        <View style={styles.content}>
          <DefectDensityMeter density={density} />

          <View style={styles.klocRow}>
            <Text style={styles.klocLabel}>KLOC:</Text>
            <TextInput
              style={styles.klocInput}
              value={klocInput}
              onChangeText={onKlocInputChange}
              keyboardType="numeric"
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.updateButton, klocChanged && styles.updateButtonActive]}
              onPress={onKlocUpdate}
              disabled={!klocChanged}
            >
              <Icon
                name="check"
                size={18}
                color={klocChanged ? '#ffffff' : '#94a3b8'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.calculateButton} onPress={onCalculatePress}>
            <Text style={styles.calculateButtonText}>Calculate KLOC</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  content: {
    alignItems: 'center',
  },
  meterContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  meterWrapper: {
    width: 200,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  densityValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  klocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  klocLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
    marginRight: 8,
  },
  klocInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 16,
    color: '#0f172a',
    width: 80,
    textAlign: 'center',
  },
  updateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  updateButtonActive: {
    backgroundColor: '#22c55e',
  },
  calculateButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  calculateButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DefectDensityCard;