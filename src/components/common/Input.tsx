import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { CommonStyles } from '../../constants/commonStyles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  secureTextEntry,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[Typography.label, styles.label]}>{label}</Text>}
      <View
        style={[
          CommonStyles.passwordWrapper,
          error && CommonStyles.inputError,
        ]}
      >
        <TextInput
          style={[CommonStyles.passwordInput, style]}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={isPassword ? !showPassword : false}
          accessibilityLabel={label}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={toggleShowPassword}
            style={CommonStyles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={CommonStyles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
          >
            <Icon name={rightIcon} size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text style={CommonStyles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 6,
  },
});