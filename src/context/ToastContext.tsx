import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: string; accent: string; bg: string; border: string; defaultTitle: string }
> = {
  success: {
    icon: 'check-circle',
    accent: Colors.success,
    bg: Colors.successBg,
    border: Colors.successBorder,
    defaultTitle: 'Success',
  },
  error: {
    icon: 'alert-circle',
    accent: Colors.error,
    bg: Colors.errorBg,
    border: Colors.errorBorder,
    defaultTitle: 'Something went wrong',
  },
  warning: {
    icon: 'alert-triangle',
    accent: Colors.warning,
    bg: Colors.warningBg,
    border: Colors.warningBorder,
    defaultTitle: 'Heads up',
  },
  info: {
    icon: 'info',
    accent: Colors.info,
    bg: Colors.infoBg,
    border: Colors.infoBorder,
    defaultTitle: 'Info',
  },
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ToastOptions>({ message: '' });
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (opts: ToastOptions) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      setOptions(opts);
      setVisible(true);
      translateY.setValue(-140);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
          mass: 0.9,
          stiffness: 180,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = opts.duration ?? 3200;
      hideTimer.current = setTimeout(dismiss, duration);
    },
    [dismiss, opacity, translateY]
  );

  const success = useCallback((message: string, title?: string) => showToast({ message, title, variant: 'success' }), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast({ message, title, variant: 'error' }), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast({ message, title, variant: 'warning' }), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast({ message, title, variant: 'info' }), [showToast]);

  const variant = options.variant ?? 'info';
  const config = VARIANT_CONFIG[variant];

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.wrapper,
            {
              top: insets.top + 8,
              opacity,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={dismiss}
            style={[
              styles.toast,
              { backgroundColor: config.bg, borderColor: config.border },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: config.accent }]}>
              <Icon name={config.icon} size={18} color={Colors.white} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[Typography.label, { color: config.accent }]} numberOfLines={1}>
                {options.title || config.defaultTitle}
              </Text>
              <Text style={[Typography.body, styles.message]} numberOfLines={3}>
                {options.message}
              </Text>
            </View>
            <TouchableOpacity onPress={dismiss} hitSlop={10} style={styles.closeBtn}>
              <Icon name="x" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999,
    elevation: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
