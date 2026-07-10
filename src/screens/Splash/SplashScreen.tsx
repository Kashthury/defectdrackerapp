import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import GradientBackground from '../../components/layout/GradientBackground';

const SplashScreen = () => {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={[Typography.title, styles.title]}>
          Defect Tracker Pro
        </Text>
        <ActivityIndicator size="large" color={Colors.white} style={styles.loader} />
        <Text style={[Typography.body, { color: Colors.white }]}>
          Optimizing your workflow...
        </Text>
      </View>
    </GradientBackground>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },
  title:{
    color: Colors.white,
    fontSize: 40,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 30,
  }
});