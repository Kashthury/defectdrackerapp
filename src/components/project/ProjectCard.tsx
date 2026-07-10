import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface ProjectCardProps {
  project: { id: number; name: string; risk?: 'high' | 'medium' | 'low' };
  onPress: () => void;
  size?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, size = 160 }) => {
  const { name, risk = 'low' } = project;

  const getBorderColor = () => {
    switch (risk) {
      case 'high': return Colors.error;
      case 'medium': return Colors.warning;
      default: return Colors.success;
    }
  };

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size, borderColor: getBorderColor() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.circle, { backgroundColor: getBorderColor() + '10' }]}>
        <Text style={[styles.initials, { color: getBorderColor() }]}>{getInitials(name)}</Text>
      </View>
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <View style={[styles.indicator, { backgroundColor: getBorderColor() }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 100, // Makes it circular
    borderWidth: 2,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // Premium shadow
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  initials: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: {
    ...Typography.bodyBold,
    fontSize: 14,
    textAlign: 'center',
    color: Colors.text,
    paddingHorizontal: 4,
  },
  indicator: {
    position: 'absolute',
    bottom: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
  }
});