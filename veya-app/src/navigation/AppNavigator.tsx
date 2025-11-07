import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import Welcome from '../screens/onboarding/Welcome';
import Breathe from '../screens/onboarding/Breathe';
import { Sleep } from '../screens/onboarding/Sleep';
import Personalize from '../screens/onboarding/Personalize';

type RootStackParamList = {
  Welcome: undefined;
  Breathe: undefined;
  Sleep: undefined;
  Personalize: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Breathe" component={Breathe} />
        <Stack.Screen name="Sleep" component={Sleep} />
        <Stack.Screen name="Personalize" component={Personalize} />
        <Stack.Screen name="Main" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

