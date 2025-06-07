import {useEffect} from 'react';
import {PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';

const requestUserPermision = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    console.log('Notification Permission Granted');
  } else {
    console.log('Notification Permission Denied');
  }
};

const getToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM', token);
  } catch (error) {
    console.error('failed to get FCM token', error);
  }
};

export const useNotifications = () => {
  useEffect(() => {
    requestUserPermision();
    getToken();
  }, []);
};
