import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';
import Icon from 'react-native-vector-icons/Feather';
import { Modal } from '../../components/common/Modal';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Icon name="user" size={60} color={Colors.primary} />
        </View>
        <Text style={[Typography.title, styles.name]}>{user?.name || 'User Name'}</Text>
        <Text style={Typography.subtitle}>{user?.email || 'user@example.com'}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowChangePassword(true)}
          accessibilityRole="button"
          accessibilityLabel="Change password"
        >
          <Icon name="lock" size={20} color={Colors.textSecondary} />
          <Text style={styles.menuText}>Change Password</Text>
          <Icon name="chevron-right" size={20} color={Colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={() => setShowLogoutModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Icon name="log-out" size={20} color={Colors.error} />
          <Text style={[styles.menuText, { color: Colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

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
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  name: {
    marginTop: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  logoutItem: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
});

export default ProfileScreen;
