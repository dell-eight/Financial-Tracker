import { useNetInfo } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const netInfo = useNetInfo();
  // isConnected is null until the first check completes — treat null as online
  // to avoid false offline flashes on startup
  const isOnline = netInfo.isConnected !== false;
  return { isOnline };
}
