// App.js
import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import ClientDetails from './src/screens/ClientDetails';
import AddEditClient from './src/screens/AddEditClient';
import PoliciesScreen from './src/screens/PoliciesScreen';
import PolicyDetails from './src/screens/PolicyDetails';
import AddEditPolicy from './src/screens/AddEditPolicy';
import RenewalsScreen from './src/screens/RenewalsScreen';
import ClaimsScreen from './src/screens/ClaimsScreen';

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2B6CB0', // blue
    accent: '#FFB86B',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Clients" component={ClientsScreen} />
            <Stack.Screen name="ClientDetails" component={ClientDetails} options={{ title: 'Client Details' }} />
            <Stack.Screen name="AddEditClient" component={AddEditClient} options={{ title: 'Add / Edit Client' }} />
            <Stack.Screen name="Policies" component={PoliciesScreen} />
            <Stack.Screen name="PolicyDetails" component={PolicyDetails} options={{ title: 'Policy Details' }} />
            <Stack.Screen name="AddEditPolicy" component={AddEditPolicy} options={{ title: 'Add / Edit Policy' }} />
            <Stack.Screen name="Renewals" component={RenewalsScreen} />
            <Stack.Screen name="Claims" component={ClaimsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}