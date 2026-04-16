import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean;
  isSlow: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isSlow: false,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkContextType>({
    isConnected: true,
    isSlow: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState({
        isConnected: !!state.isConnected && (!!state.isInternetReachable || state.isInternetReachable === null),
        isSlow: state.type === 'cellular' && state.details && ('cellularGeneration' in state.details) && 
                (state.details.cellularGeneration === '2g' || state.details.cellularGeneration === '3g'),
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
};
