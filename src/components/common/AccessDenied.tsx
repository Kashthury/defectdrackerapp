import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/theme';
import { withAlpha } from '../../utils/colorUtils';

interface AccessDeniedProps {
  /** Optional custom message. Defaults to a friendly, generic explanation. */
  message?: string;
  /** Optional title override. */
  title?: string;
  /** Whether to fill the screen (centered) or render inline. */
  fullScreen?: boolean;
}

/**
 * Friendly "you don't have access" state shown when a user tries to view a
 * screen or module they lack permission for. Used by ProtectedScreen and can be
 * rendered directly by any screen.
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = "You don't have permission to view this content. Contact your project administrator if you believe this is a mistake.",
  title = 'Access restricted',
  fullScreen = true,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.iconCircle}>
        <Icon name="lock" size={34} color={Colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    backgroundColor: withAlpha(Colors.error, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.sectionTitle,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.subtitle,
    fontSize: 15,
    textAlign: 'center',
    color: Colors.textSecondary,
    maxWidth: 320,
  },
});

export default AccessDenied;
