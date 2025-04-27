import React, {createContext, useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import { API_BASE_URL } from '@env';

interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    image: string,
  ) => Promise<void>;
  updateUser: (
    id: string,
    name: string,
    email: string,
    password: string,
    image: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({children}: any) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState<string | null>(null);
  const isAuthenticated = !!user;

  console.log(token);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error: any) {
      console.log('Error loading user data:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Update Failed',
        textBody: error.response?.data?.message || 'Something went wrong',
        button: 'OK',
      });
    }
  };
  useEffect(() => {

    loadUserData();
  }, []);

  const login = async (email: any, password: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      console.log(response)
      const {user: resuser, token: restoken} = response.data;

      // Store user & token in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(resuser));
      await AsyncStorage.setItem('token', restoken);

      // Set user & token in state
      setUser(resuser);
      setToken(restoken);
      return response.data;
    } catch (error: any) {
      console.error(error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Login Failed',
        textBody: error.response?.data?.message,
        button: 'OK',
      });
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    imageUri: string | null,
  ) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      if (imageUri) {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      }
console.log(`${API_BASE_URL}/auth/register`)
      const response = await axios.post(`${API_BASE_URL}/auth/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const {user: resuser, token: restoken} = response.data;

      // Store user & token in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(resuser));
      await AsyncStorage.setItem('token', restoken);

      // Set user & token in state
      setUser(resuser);
      setToken(restoken);
      return response.data;
    } catch (error: any) {
      console.log('Error:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'SignUp Failed',
        textBody: error.response?.data?.message || '',
        button: 'OK',
      });
    }
  };

  const logout = async () => {
    console.log('in');
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    } catch (error) {
      Alert.alert('Logout Failed', 'Something went wrong');
    }
  };

  const updateUser = async (
    name: string,
    email: string,
    password: string,
    imageUri: string | null,
  ) => {
    try {
      // Retrieve JWT token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      console.log(token);
      if (!token) {
        Alert.alert('Error', 'Authentication token is missing');
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      if (imageUri) {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }

      const response = await axios.put(`${API_BASE_URL}/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response)
      const {updatedUser, token: newToken} = response.data;

      // Store updated user & new token in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await AsyncStorage.setItem('token', newToken);

      // Update state
      setUser(updatedUser);
      setToken(newToken);
    } catch (error: any) {
      console.log('Error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{user, isAuthenticated, login, signup, logout, updateUser}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
