import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AlertNotificationRoot} from 'react-native-alert-notification';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';

import LoginScreen from './features/screens/LoginScreen';
import SignupScreen from './features/screens/SignupScreen';
import HomeScreen from './features/screens/HomeScreen';
import ProfileScreen from './features/screens/ProfileScreen';
import CreateScreen from './features/screens/CreateScreen';
import GroupDetailsScreen from './features/screens/GroupDetailsScreen';
import Icon from 'react-native-vector-icons/FontAwesome';
import {AuthProvider} from './features/context/AuthContext';
import {GroupProvider} from './features/context/GroupContext';
import {SearchProvider} from './features/context/SearchContext';
import SearchScreen from './features/screens/SearchScreen';
import {useNotifications} from './features/notifications/useNotifications';
import {MenuProvider} from 'react-native-popup-menu';
import messaging from '@react-native-firebase/messaging';
import {navigationRef} from './features/service/NavigationService';
import {InteractionManager} from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Enhanced Custom Tab Bar with Animations
const CustomTabBar = ({state, descriptors, navigation}:any) => {
  const [animatedValues] = useState(
    state.routes.map(() => new Animated.Value(0)),
  );

  const animateTab = (index:any, isFocused:any) => {
    Animated.spring(animatedValues[index], {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  React.useEffect(() => {
    state.routes.forEach((_, index) => {
      animateTab(index, state.index === index);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          // Icon mapping with better icons
          const getIconName = (routeName) => {
            switch (routeName) {
              case 'Home':
                return 'home';
              case 'Search':
                return 'search';
              case 'Create':
                return 'plus-circle';
              case 'Profile':
                return 'user-circle';
              default:
                return 'circle';
            }
          };

          const scale = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.2],
          });

          const translateY = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -3],
          });

          return (
            <TouchableOpacity
              key={index}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}>
              <Animated.View
                style={[
                  styles.tabButton,
                  isFocused && styles.tabButtonActive,
                  {
                    transform: [{scale}, {translateY}],
                  },
                ]}>
                <View style={isFocused ? styles.iconContainer : null}>
                  <Icon
                    name={getIconName(route.name)}
                    size={route.name === 'Create' ? 28 : 22}
                    color={isFocused ? '#fff' : '#666'}
                  />
                </View>
                {!isFocused && (
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused && styles.tabLabelActive,
                    ]}>
                    {label}
                  </Text>
                )}
              </Animated.View>
              {isFocused && (
                <Animated.View
                  style={[
                    styles.activeIndicator,
                    {
                      opacity: animatedValues[index],
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};


const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarLabel: 'Create',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useNotifications();

  useEffect(() => {
    const handleNavigation = (remoteMessage: any) => {
      const {Id, type} = remoteMessage?.data || {};
      if (
        type === 'groupReminder' ||
        type === 'joinRequest' ||
        (type === 'taskCompleted' && typeof Id === 'string')
      ) {
        const navigateToGroup = () => {
          if (navigationRef.isReady()) {
            navigationRef.navigate('GroupDetails', {groupId:Id});
          } else {
            console.log('⏳ Navigation not ready, retrying...');
            setTimeout(navigateToGroup, 100);
          }
        };

        InteractionManager.runAfterInteractions(navigateToGroup);
      } else {
        if (type === 'userProfile' && typeof Id === 'string') {
          const navigateToProfile = () => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('Profile', {user: Id});
            } else {
              console.log('⏳ Navigation not ready, retrying...');
              setTimeout(navigateToProfile, 100);
            }
          };

          InteractionManager.runAfterInteractions(navigateToProfile);
        }
      }
    };

    // When app is in background and opened by tapping notification
    const unsubscribeOpened =
      messaging().onNotificationOpenedApp(handleNavigation);

    // When app is launched from quit state via notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          handleNavigation(remoteMessage);
        }
      });

    return () => {
      unsubscribeOpened(); // clean up
    };
  }, []);
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

  if (initialRoute === null) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <AlertNotificationRoot>
        <AuthProvider>
          <GroupProvider>
            <MenuProvider>
              <SearchProvider>
                <Stack.Navigator
                  screenOptions={{headerShown: false}}
                  initialRouteName={initialRoute}>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Signup" component={SignupScreen} />
                  <Stack.Screen name="Main" component={TabNavigator} />
                  <Stack.Screen
                    name="GroupDetails"
                    component={GroupDetailsScreen}
                  />
                </Stack.Navigator>
              </SearchProvider>
            </MenuProvider>
          </GroupProvider>
        </AuthProvider>
      </AlertNotificationRoot>
    </NavigationContainer>
  );
};


const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111',
    // borderRadius: 30,
    height: 75,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 25,
    minHeight: 60,
  },
  tabButtonActive: {
    backgroundColor: 'transparent',
  },
  iconContainer: {
    // backgroundColor: '#8B5CF6',
    borderRadius: 60,
    padding: 8,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  // activeIndicator: {
  //   position: 'absolute',
  //   bottom: 19,
  //   width: 6,
  //   height: 6,
  //   borderRadius: 3,
  //   backgroundColor: '#8B5CF6',
  // },
});
export default AppNavigator;
