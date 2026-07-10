import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const GradientBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LinearGradient
    colors={[Colors.gradientStart, Colors.gradientEnd]}
    style={styles.gradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    {children}
  </LinearGradient>
);

const styles = StyleSheet.create({
  gradient: { flex: 1 },
});

export default GradientBackground;