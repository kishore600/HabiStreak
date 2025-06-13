// components/ForgotPasswordModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { ActivityIndicator } from 'react-native-paper';
import axios from 'axios';
import { API_URL } from '@env';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ForgotPasswordModal: React.FC<Props> = ({ visible, onClose }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/forgetpassword`, {
        email,
      });
      Alert.alert('Success', res.data.message || 'Reset email sent!');
      setEmail("")
      onClose();
    } catch (error: any) {
      console.log(error)
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Forgot Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && (
            <Animatable.Text animation="shake" style={styles.errorText}>
              {errors.email}
            </Animatable.Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#1c1c1e" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.footerText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    height: 50,
  },
  button: {
    backgroundColor: '#FFD700',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#1c1c1e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 15,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 12,
    marginBottom: 10,
  },
});

export default ForgotPasswordModal;
