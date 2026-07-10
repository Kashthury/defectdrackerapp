import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  /** Disables the confirm button (e.g. until a valid selection is made). */
  confirmDisabled?: boolean;
  /** Shows a spinner on the confirm button while an action is in flight. */
  confirmLoading?: boolean;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
  confirmDisabled = false,
  confirmLoading = false,
  children,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modal}>
              {title && <Text style={Typography.title}>{title}</Text>}
              {message && (
                <Text style={[Typography.body, styles.message]}>{message}</Text>
              )}
              {children}
              <View style={styles.buttonContainer}>
                {showCancel && (
                  <Button
                    title={cancelText}
                    onPress={onClose}
                    variant="outline"
                    fullWidth={false}
                    style={styles.button}
                  />
                )}
                {onConfirm && (
                  <Button
                    title={confirmText}
                    onPress={onConfirm}
                    variant="primary"
                    fullWidth={false}
                    style={styles.button}
                    disabled={confirmDisabled}
                    loading={confirmLoading}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    marginVertical: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});