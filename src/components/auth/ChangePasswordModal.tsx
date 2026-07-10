import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { changePassword } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../utils/apiError';

export const MIN_PASSWORD_LENGTH = 6;

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TouchedState {
  current: boolean;
  next: boolean;
  confirm: boolean;
}

const INITIAL_TOUCHED: TouchedState = { current: false, next: false, confirm: false };

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<TouchedState>(INITIAL_TOUCHED);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  // Start every time the modal opens with a clean, empty form.
  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTouched(INITIAL_TOUCHED);
      setSubmitError('');
      setLoading(false);
    }
  }, [visible]);

  // Live validity used to enable/disable the submit button.
  const isFormValid = useMemo(
    () =>
      currentPassword.trim().length > 0 &&
      newPassword.length >= MIN_PASSWORD_LENGTH &&
      newPassword !== currentPassword &&
      confirmPassword === newPassword,
    [currentPassword, newPassword, confirmPassword]
  );

  // Field-level errors, revealed only after a field has been touched (or on submit).
  const currentPasswordError =
    touched.current && !currentPassword.trim() ? 'Current password is required' : '';

  let newPasswordError = '';
  if (touched.next) {
    if (!newPassword) {
      newPasswordError = 'New password is required';
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      newPasswordError = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    } else if (currentPassword && newPassword === currentPassword) {
      newPasswordError = 'New password must be different from your current password';
    }
  }

  let confirmPasswordError = '';
  if (touched.confirm) {
    if (!confirmPassword) {
      confirmPasswordError = 'Please confirm your new password';
    } else if (confirmPassword !== newPassword) {
      confirmPasswordError = 'Passwords do not match';
    }
  }

  const clearSubmitError = () => {
    if (submitError) setSubmitError('');
  };

  const handleClose = () => {
    if (loading) return; // don't allow dismissing mid-request
    onClose();
  };

  const handleSubmit = async () => {
    // Reveal any outstanding validation messages.
    setTouched({ current: true, next: true, confirm: true });
    setSubmitError('');
    if (!isFormValid) return;

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setLoading(false);
      onClose();
      // Toast is shown after the modal closes so it isn't hidden behind it.
      toast.success(
        "We've sent a confirmation link to your email. Please check your inbox to finish updating your password.",
        'Check your email'
      );
    } catch (error: any) {
      setLoading(false);
      // The backend's own message wins (so validation details like new-password
      // rules are shown); otherwise a 400/401/403 on this authenticated call
      // almost always means the current password didn't match.
      const wrongCurrent = 'Your current password is incorrect. Please try again.';
      setSubmitError(
        getApiErrorMessage(error, "We couldn't update your password. Please try again.", {
          400: wrongCurrent,
          401: wrongCurrent,
          403: wrongCurrent,
        })
      );
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
            <View style={styles.card} accessibilityViewIsModal>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.header}>
                  <View style={styles.headerIcon}>
                    <Icon name="lock" size={20} color={Colors.primary} />
                  </View>
                  <Text style={[Typography.heading, styles.title]}>Change Password</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    disabled={loading}
                  >
                    <Icon name="x" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[Typography.subtitle, styles.subtitle]}>
                  Enter your current password and choose a new one.
                </Text>

                {submitError ? (
                  <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                    <Icon
                      name="alert-circle"
                      size={18}
                      color={Colors.error}
                      style={styles.errorBannerIcon}
                    />
                    <Text style={styles.errorBannerText}>{submitError}</Text>
                  </View>
                ) : null}

                <Input
                  label="Current Password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChangeText={text => {
                    setCurrentPassword(text);
                    clearSubmitError();
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, current: true }))}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="password"
                  error={currentPasswordError}
                  returnKeyType="next"
                />

                <Input
                  label="New Password"
                  placeholder="Enter a new password"
                  value={newPassword}
                  onChangeText={text => {
                    setNewPassword(text);
                    clearSubmitError();
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, next: true }))}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  error={newPasswordError}
                  returnKeyType="next"
                />
                {!newPasswordError ? (
                  <Text style={styles.helperText}>
                    Use at least {MIN_PASSWORD_LENGTH} characters.
                  </Text>
                ) : null}

                <Input
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChangeText={text => {
                    setConfirmPassword(text);
                    clearSubmitError();
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  error={confirmPasswordError}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />

                <View style={styles.footer}>
                  <Button
                    title="Cancel"
                    onPress={handleClose}
                    variant="outline"
                    fullWidth={false}
                    style={styles.footerButton}
                    disabled={loading}
                  />
                  <Button
                    title="Update"
                    onPress={handleSubmit}
                    variant="primary"
                    fullWidth={false}
                    style={styles.footerButton}
                    disabled={!isFormValid}
                    loading={loading}
                  />
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
  },
  subtitle: {
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.errorBg,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorBannerIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  errorBannerText: {
    ...Typography.caption,
    flex: 1,
    color: Colors.error,
    fontWeight: '600',
  },
  helperText: {
    ...Typography.caption,
    marginTop: -12,
    marginBottom: 20,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  footerButton: {
    flex: 1,
  },
});
