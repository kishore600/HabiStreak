import { API_URL } from '@env';
import { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const ForceUpdateCheck = () => {
  useEffect(() => {
    const checkAppVersion = async () => {
      const currentVersion = DeviceInfo.getVersion();

      try {
        const response = await fetch(`${API_URL}/version/latest-version`);
        const data = await response.json();
console.log(data)
        const latestVersion = data.latestVersion;
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
                  Linking.openURL(
                    Platform.OS === 'android' ? playStoreUrl : appStoreUrl
                  ),
              },
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.error('Failed to fetch app version:', error);
      }
    };

    checkAppVersion();
  }, []);

  return null;
};

// 🔍 Semantic version comparison
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
