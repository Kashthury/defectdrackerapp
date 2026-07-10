import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '../../components/layout/GradientBackground';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { CommonStyles } from '../../constants/commonStyles';
import { Typography } from '../../constants/typography';
import { forgotPassword } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../utils/apiError';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success(
        "If an account exists for that email, we've sent a password reset link. Please check your inbox (and spam folder).",
        'Check your email'
      );
      navigation.goBack();
    } catch (error: any) {
      toast.error(
        getApiErrorMessage(error, 'Failed to send the reset link. Please try again.'),
        'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={CommonStyles.container}
      >
        <View style={CommonStyles.card}>
          <Text style={Typography.title}>Forgot Password</Text>
          <Text style={[Typography.subtitle, { marginBottom: 32 }]}>
            Enter your email to reset your password.
          </Text>

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <Button
            title="Send Reset Link"
            onPress={handleSend}
            loading={loading}
            disabled={loading || !email.trim()}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={CommonStyles.backLink}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Text style={Typography.link}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

export default ForgotPasswordScreen;