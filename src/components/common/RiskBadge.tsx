import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface RiskBadgeProps {
  risk: 'high' | 'medium' | 'low';
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ risk }) => {
  const getColor = () => {
    switch (risk) {
      case 'high': return Colors.error;
      case 'medium': return Colors.warning;
      default: return Colors.success;
    }
  };
  const label = risk.charAt(0).toUpperCase() + risk.slice(1) + ' Risk';

  return (
    <View style={[styles.badge, { backgroundColor: getColor() }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default RiskBadge;