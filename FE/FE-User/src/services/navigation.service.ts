import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
  } else {
    console.log('[Navigation] Navigator not ready yet');
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export default {
  navigationRef,
  navigate,
  goBack,
};

