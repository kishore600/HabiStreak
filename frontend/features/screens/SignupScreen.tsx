import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../context/AuthContext';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';

const SignupScreen = ({ navigation }: { navigation: any }) => {
  const { signup }: any = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const selectImage = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: false },
      (response: any) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.log('Image picker error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          setImageUri(response.assets[0].uri);
        }
      }
    );
  };

  const handleSignup = async () => {
    let newErrors: any = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setLoading(true);
      const data = await signup(name, email, password, imageUri);
      if (data) {
        navigation.navigate('Main');
        setErrors({});
      }
    } catch (error: any) {
      console.log('Signup error:', error);
      const errorMessage ='Signup failed. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={selectImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Image
            source={require('../../assets/dummy.jpg')}
            style={styles.image}
          />
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#999"
        value={name}
        onChangeText={text => {
          setName(text);
          setErrors((prev: any) => ({ ...prev, name: '' }));
        }}
      />
      {errors.name && (
        <Animatable.Text animation="shake" style={styles.errorText}>
          {errors.name}
        </Animatable.Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={text => {
          setEmail(text);
          setErrors((prev: any) => ({ ...prev, email: '' }));
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && (
        <Animatable.Text animation="shake" style={styles.errorText}>
          {errors.email}
        </Animatable.Text>
      )}

      {/* <View> */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={text => {
            setPassword(text);
            setErrors((prev: any) => ({ ...prev, password: '' }));
          }}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(prev => !prev)}
          style={styles.eyeIcon}
        >
          <Icon
            name={showPassword ? 'eye-slash' : 'eye'}
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      {/* </View> */}
      {errors.password && (
        <Animatable.Text animation="shake" style={styles.errorText}>
          {errors.password}
        </Animatable.Text>
      )}

      {errors.general && (
        <Animatable.Text animation="shake" style={styles.errorText}>
          {errors.general}
        </Animatable.Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#1c1c1e" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text
          style={styles.signupText}
          onPress={() => navigation.navigate('Login')}
        >
          Login
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  imagePicker: {
    width: 120,
    height: 120,
    backgroundColor: '#333',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#FFD700',
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
  disabledButton: {
    backgroundColor: '#999',
    height: 59,
  },
  eyeIcon: {
    padding: 10,
  },
});

export default SignupScreen;
