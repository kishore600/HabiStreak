import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AlertNotificationRoot} from 'react-native-alert-notification';

import LoginScreen from './features/screens/LoginScreen';
import SignupScreen from './features/screens/SignupScreen';
import HomeScreen from './features/screens/HomeScreen';
import ProfileScreen from './features/screens/ProfileScreen';
import ConvoScreen from './features/screens/ConvoScreen';
import Icon from 'react-native-vector-icons/FontAwesome';
import {AuthProvider} from './features/context/AuthContext';
import {ConvoProvider} from './features/context/ConvoContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          const icons = {
            Home: 'coffee',
            Profile: 'user',
            Convo: 'plus',
          };
          return (
            <Icon name={icons[route.name] as any} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {backgroundColor: '#f8f9fa'},
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Convo" component={ConvoScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');

        if (storedUser && storedToken) {
          setInitialRoute('Main');
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };

    checkUserSession();
  }, []);

  if (initialRoute === null) return null; // Prevent rendering until initialRoute is determined

  return (
    <NavigationContainer>
      <AlertNotificationRoot>
        <AuthProvider>
          <ConvoProvider>
            <Stack.Navigator
              screenOptions={{headerShown: false}}
              initialRouteName={initialRoute}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="Main" component={TabNavigator} />
            </Stack.Navigator>
          </ConvoProvider>
        </AuthProvider>
      </AlertNotificationRoot>
    </NavigationContainer>
  );
};

export default AppNavigator;
