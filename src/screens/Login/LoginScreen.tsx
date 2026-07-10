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
import { Loader } from '../../components/common/Loader';
import { CommonStyles } from '../../constants/commonStyles';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../utils/apiError';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { signIn, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let valid = true;
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Invalid email format');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation happens automatically once the auth token is set.
    } catch (error: any) {
      const status = error?.response?.status;
      if (!error?.response) {
        // No response at all: offline, wrong host, or a timeout.
        toast.error(
          'Could not connect to the server. Please check your connection and make sure the backend is reachable.',
          'Network error'
        );
      } else if (status === 400 || status === 401 || status === 403) {
        // Bad credentials: keep it clear and non-technical.
        toast.error(
          'The email or password you entered is incorrect. Please try again.',
          'Login failed'
        );
      } else {
        toast.error(getApiErrorMessage(error), 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loader fullScreen />;
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={CommonStyles.container}
      >
        <View style={CommonStyles.card}>
          <Text style={Typography.title}>DefectTracker Pro</Text>
          <Text style={[Typography.subtitle, { marginBottom: 32 }]}>
            Sign in to your account
          </Text>

          <Input
            label="Email"
            placeholder="Enter your Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={passwordError}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            style={CommonStyles.link}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={Typography.link}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

export default LoginScreen;