import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Icon from 'react-native-vector-icons/Feather';

const ProjectSummaryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { projectId } = route.params as any;

  // Mock counts - usually you'd fetch these from an API
  const testCaseCount = 42;
  const defectCount = 12;

  const renderOptionCard = (title: string, count: number, icon: string, color: string, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.optionCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[Typography.label, styles.cardTitle]}>{title}</Text>
        <Text style={[Typography.title, { color: color, fontSize: 24 }]}>{count}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.title}>Project Overview</Text>
        <Text style={Typography.subtitle}>Project ID: {projectId}</Text>
      </View>

      <View style={styles.grid}>
        {renderOptionCard(
          'Test Cases',
          testCaseCount,
          'file-text',
          '#3b82f6', // Blue
          () => navigation.navigate('TestCases', { projectId })
        )}

        {renderOptionCard(
          'Defects',
          defectCount,
          'alert-circle',
          '#ef4444', // Red
          () => navigation.navigate('Defects', { projectId })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  grid: {
    padding: 16,
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 6,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});

export default ProjectSummaryScreen;
