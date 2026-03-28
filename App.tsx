import './src/i18n';
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, View } from "react-native";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import HomeScreen from "./src/screens/HomeScreen";
import PreviewScreen from "./src/screens/PreviewScreen";
import SuccessScreen from "./src/screens/SuccessScreen";
import PaywallScreen from "./src/screens/PaywallScreen";
import SubscriptionScreen from "./src/screens/SubscriptionScreen";
import { initializePurchases, checkSubscriptionStatus } from "./src/services/purchaseService";

export type RootStackParamList = {
  Onboarding: undefined;
  Paywall: undefined;
  Subscription: undefined;
  Home: undefined;
  Preview: { events: CalendarEvent[]; imageUri: string };
  Success: undefined;
};

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initializePurchases();
      } catch (e) {
        console.warn('[RevenueCat] init failed:', e);
      }
      try {
        const subscribed = await checkSubscriptionStatus();
        setInitialRoute(subscribed ? "Home" : "Onboarding");
      } catch {
        setInitialRoute("Onboarding");
      }
    })();
  }, []);

  if (!initialRoute) {
    return <View style={{ flex: 1, backgroundColor: "#0A0A0F" }} />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <Stack.Navigator
        id="RootStack"
        initialRouteName={initialRoute ?? "Onboarding"}
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
