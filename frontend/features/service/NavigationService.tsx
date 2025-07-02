import { createNavigationContainerRef } from '@react-navigation/native';
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  GroupDetails: any;
  Profile:any
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
