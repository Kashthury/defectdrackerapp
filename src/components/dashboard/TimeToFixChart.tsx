import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from '../dashboard/LineChart';
import { SectionHeader } from '../common/SectionHeader';

interface TimeToFindChartProps {
  data: { day: string; defects: number }[];
}

export const TimeToFindChart: React.FC<TimeToFindChartProps> = ({ data }) => {
  const labels = data.map(d => d.day);
  const values = data.map(d => d.defects);
  return (
    <View style={styles.container}>
      <SectionHeader title="Time to Find Defects" />
      <LineChart labels={labels} data={values} color="#2563eb" />
    </View>
  );
};

const styles = StyleSheet.create({ container: { marginVertical: 16 } });