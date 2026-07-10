import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import GradientBackground from '../../components/layout/GradientBackground';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { CommonStyles } from '../../constants/commonStyles';
import { Typography } from '../../constants/typography';
import { resetPassword } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { MIN_PASSWORD_LENGTH } from '../../components/auth/ChangePasswordModal';

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const token = (route.params as any)?.token;
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.', 'Something went wrong');
      navigation.goBack();
    }
  }, [token, navigation]);

  const validate = () => {
    let valid = true;
    if (!newPassword.trim()) {
      setNewPasswordError('Password is required');
      valid = false;
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setNewPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      valid = false;
    } else {
      setNewPasswordError('');
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    } else {
      setConfirmPasswordError('');
    }
    return valid;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      toast.success('Password reset successfully. Redirecting to login...', 'All set');
      navigation.navigate('Login' as never);
    } catch (error: any) {
      toast.error(
        getApiErrorMessage(error, 'Failed to reset password. Please try again.'),
        'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    newPassword.length >= MIN_PASSWORD_LENGTH && confirmPassword === newPassword;

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={CommonStyles.container}
      >
        <View style={CommonStyles.card}>
          <Text style={Typography.title}>Reset Password</Text>
          <Text style={[Typography.subtitle, { marginBottom: 32 }]}>
            Enter your new password
          </Text>

          <Input
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            error={newPasswordError}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={confirmPasswordError}
          />

          <Button
            title="Reset Password"
            onPress={handleReset}
            loading={loading}
            disabled={loading || !isValid}
          />

          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login' as never)}
            variant="outline"
            style={{ marginTop: 12 }}
          />
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

export default ResetPasswordScreen;