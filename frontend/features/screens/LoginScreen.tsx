import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ActivityIndicator } from 'react-native-paper';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const LoginScreen = ({navigation}: any) => {
  const {login}: any = useAuth(); // Get setUser function from context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const[loading,setLoading] = useState(false)
    const [isForgotVisible, setIsForgotVisible] = useState(false); // ← New

  const validateForm = () => {
    let newErrors: any = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setLoading(true)
    if (!validateForm()) return setLoading(false);
    try {
      const userData = await login(email, password); // ✅ Call login function
      if (userData) {
        navigation.navigate('Main');
      }
    } catch (error) {
      // Handle the error (e.g., show a message to the user)
      console.error('Login failed:', error);
    }finally{
      setLoading(false)
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
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
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(prev => !prev)}
          style={styles.eyeIcon}>
          <Icon
            name={showPassword ? 'eye-slash' : 'eye'}
            size={20}
            color="#999"
          />
        </TouchableOpacity>

      {errors.password && (
        <Animatable.Text animation="shake" style={styles.errorText}>
          {errors.password}
        </Animatable.Text>
      )}
      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#1c1c1e" />
        ) : (
          <Text style={styles.buttonText}>Login In</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Don't have an account?{' '}
        <Text
          style={styles.signupText}
          onPress={() => navigation.navigate('Signup')}>
          Sign up
        </Text>

        
      </Text>
       <TouchableOpacity
        onPress={() => setIsForgotVisible(true)}
        style={{ alignSelf: 'center', marginBottom: 10,marginTop:10 }}
      >
        <Text style={{ color: '#FFD700', fontSize: 14 }}>Forgot Password?</Text>
      </TouchableOpacity>
      
       <ForgotPasswordModal
        visible={isForgotVisible}
        onClose={() => setIsForgotVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e', // Dark background (Instagram feel)
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700', // Yellow (gold-like)
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333', // Dark input background
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FFD700', // Bright yellow button
    width: '100%',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#1c1c1e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#999',
    marginTop: 20,
    fontSize: 14,
  },
  signupText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 12,
    marginBottom: 10,
  },
  eyeIcon: {
    padding: 10,
  },
    disabledButton: {
    backgroundColor: '#999',
    height: 59,
  },
});

export default LoginScreen;
