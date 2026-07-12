import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface RiskSummaryProps {
  riskCounts: { high: number; medium: number; low: number };
}

type SummaryItem = {
  key: 'high' | 'medium' | 'low';
  label: string;
  count: number;
  color: string;
  icon: string;
};

export const RiskSummary: React.FC<RiskSummaryProps> = ({ riskCounts }) => {
  const items: SummaryItem[] = [
    {
      key: 'high',
      label: 'High Risk',
      count: riskCounts.high,
      color: Colors.error,
      icon: 'alert-octagon',
    },
    {
      key: 'medium',
      label: 'Medium Risk',
      count: riskCounts.medium,
      color: Colors.warning,
      icon: 'alert-triangle',
    },
    {
      key: 'low',
      label: 'Low Risk',
      count: riskCounts.low,
      color: Colors.success,
      icon: 'check-circle',
    },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.key} style={[styles.card, { borderColor: item.color + '33' }]}>
          <View
            style={[
              styles.iconChip,
              {
                backgroundColor: item.color,
                shadowColor: item.color,
              },
            ]}
          >
            <Icon name={item.icon} size={22} color={Colors.white} />
          </View>
          <Text style={styles.count} numberOfLines={1} adjustsFontSizeToFit>
            {item.count}
          </Text>
          <Text
            style={[styles.label, { color: item.color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  count: {
    ...Typography.title,
    fontSize: 30,
    marginTop: 14,
    color: Colors.text,
  },
  label: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default RiskSummary;
