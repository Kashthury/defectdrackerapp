import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows, coloredShadow } from '../../constants/theme';
import { withAlpha } from '../../utils/colorUtils';
import { useAuth } from '../../hooks/useAuth';
import Icon from 'react-native-vector-icons/Feather';
import { Modal } from '../../components/common/Modal';
import { Chip } from '../../components/common/Chip';
import { FadeInView } from '../../components/common/FadeInView';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeInView style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[Typography.title, styles.name]} numberOfLines={1}>
          {user?.name || 'User Name'}
        </Text>
        <Text style={Typography.subtitle} numberOfLines={1}>
          {user?.email || 'user@example.com'}
        </Text>
        {user?.role ? (
          <View style={styles.roleChip}>
            <Chip label={String(user.role)} color={Colors.primary} icon="shield" size="sm" />
          </View>
        ) : null}
      </FadeInView>

      <FadeInView delay={80} style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>

        <AnimatedPressable
          style={styles.menuItem}
          onPress={() => setShowChangePassword(true)}
          accessibilityRole="button"
          accessibilityLabel="Change password"
        >
          <View style={[styles.menuIcon, { backgroundColor: withAlpha(Colors.primary, 0.12) }]}>
            <Icon name="lock" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.menuText}>Change Password</Text>
          <Icon name="chevron-right" size={20} color={Colors.textLight} />
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.menuItem, styles.logoutItem]}
          onPress={() => setShowLogoutModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <View style={[styles.menuIcon, { backgroundColor: withAlpha(Colors.error, 0.12) }]}>
            <Icon name="log-out" size={18} color={Colors.error} />
          </View>
          <Text style={[styles.menuText, { color: Colors.error }]}>Logout</Text>
        </AnimatedPressable>
      </FadeInView>

      <Modal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to log out?"
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        confirmText="Logout"
        cancelText="Cancel"
      />

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.huge,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    ...Shadows.card,
  },
  name: {
    marginTop: Spacing.md,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...coloredShadow(Colors.primary, 0.35, 16, 8),
  },
  avatarText: {
    ...Typography.title,
    fontSize: 34,
    color: Colors.white,
  },
  roleChip: {
    marginTop: Spacing.md,
  },
  section: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.overline,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: Spacing.md,
    ...Typography.bodyBold,
    fontSize: 15,
  },
  logoutItem: {
    marginTop: Spacing.sm,
    borderColor: withAlpha(Colors.error, 0.25),
  },
});

export default ProfileScreen;
