import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import HomeScreen from "./src/screens/HomeScreen";
import PreviewScreen from "./src/screens/PreviewScreen";
import SuccessScreen from "./src/screens/SuccessScreen";

export type RootStackParamList = {
  Onboarding: undefined;
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
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
