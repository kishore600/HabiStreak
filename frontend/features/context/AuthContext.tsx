import React, {createContext, useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {API_URL} from '@env';

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
  fetchUserProfile:any;
  currentUser:any;
  profileUser:any;
  token:any;
  setIsCurrentUser:any;
  setProfileUser:any,
  loadUserData:any,
  sendFollowRequest:any,
  unfollowUser:any,
  getPendingRequests:any,
  handleFollowRequest:any,
  fetchProfile:any,
  pendingRequest:any
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({children}: any) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const isAuthenticated = !!user;
  const [currentUser,setIsCurrentUser] = useState(true)
  const [profileUser, setProfileUser] = useState<any>(null);
  const [pendingRequest,setPendingRequest] = useState(null)

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
    fetchProfile()
    getPendingRequests()
  }, []);

  const login = async (email: any, password: any) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      console.log(response);
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
      console.log(`${API_URL}/auth/register`,);
      const response = await axios.post(`${API_URL}/auth/register`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      console.log(response);
      const {user: resuser, token: restoken} = response.data;

      // Store user & token in AsyncStorages
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
        textBody: error.response?.data?.message || 'SignupFailed',
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

      const response = await axios.put(`${API_URL}/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
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

  const fetchUserProfile = async (userId:any) => {
    try {
    const token = await AsyncStorage.getItem("token");

      const res = await axios.get(`${API_URL}/users/${userId}`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(res.data)
      setProfileUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

const fetchProfile = async () => {
  try {

    const token = await AsyncStorage.getItem("token");

    const url = `${API_URL}/users/user/profile`;
    console.log(url)
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setUser(res.data)
  } catch (err) {
    console.error(err);
  }
};

const sendFollowRequest = async (targetUserId: string ) => {

    const response = await axios.post(
      `${API_URL}/users/follow`,
      { targetUserId:targetUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchUserProfile(targetUserId)
    return response.data;
  };

const unfollowUser = async (targetUserId: string) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.post(
      `${API_URL}/users/unfollow`,
      { targetUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Unfollow response:', response.data);
    fetchProfile();

    return response.data;
  } catch (error: any) {
    console.error('Unfollow error:', error.response?.data || error.message);
    // Optionally, show an alert or return an error object
    // Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
    return null;
  }
};

const getPendingRequests = async () => {
    const token = await AsyncStorage.getItem('token');

    const response = await axios.get(`${API_URL}/users/pending/request`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPendingRequest(response.data);
    return response.data;
  };

const handleFollowRequest = async (requesterId: string, action: string ) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log(action);

    const response = await axios.post(
      `${API_URL}/users/follow/handle`,
      { requesterId, action },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('in 1');
    fetchProfile();
    return response.data;
  } catch (error:any) {
    console.error('Follow request error:', error.response?.data || error.message);
          Dialog.show({
            type: ALERT_TYPE.DANGER,
            title: 'Handle Failed',
            textBody: 'Follow request error:'+ error.response?.data.message,
            button: 'OK',
          });
  }
};


  return (
    <AuthContext.Provider
      value={{user,getPendingRequests, isAuthenticated, login, signup, logout, updateUser,fetchUserProfile,currentUser,profileUser,token,setIsCurrentUser,setProfileUser,loadUserData,sendFollowRequest,unfollowUser,handleFollowRequest,fetchProfile,pendingRequest,}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
