import  { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const ForceUpdateCheck = () => {
  useEffect(() => {
    const checkAppVersion = async () => {
      const currentVersion = DeviceInfo.getVersion(); 

      const latestVersion = '1.0.9';
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.kishorek.habistreak'; 
      const appStoreUrl = 'https://apps.apple.com/app/id000000000';

      if (compareVersions(latestVersion, currentVersion)) {
        Alert.alert(
          'Update Required',
          'A new version of the app is available. Please update to continue.',
          [
            {
              text: 'Update Now',
              onPress: () =>
                Linking.openURL(Platform.OS === 'android' ? playStoreUrl : appStoreUrl),
            },
          ],
          { cancelable: false }
        );
      }
    };

    checkAppVersion();
  }, []);

  return null;
};

// 🔍 Semver-safe version comparison
const compareVersions = (latest: string, current: string) => {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < latestParts.length; i++) {
    if ((currentParts[i] || 0) < latestParts[i]) return true;
    if ((currentParts[i] || 0) > latestParts[i]) return false;
  }

  return false;
};

export default ForceUpdateCheck;
