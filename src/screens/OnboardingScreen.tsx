import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Calendar from "expo-calendar";

export default function OnboardingScreen({ navigation }: any) {
  const finish = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await Calendar.requestCalendarPermissionsAsync();
    navigation.replace("Home");
  };
  return (
    <LinearGradient colors={["#0A0A0F", "#0F0F1A"]} style={s.container}>
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.icon}>📅</Text>
          <Text style={s.title}>Planning vers Calendrier</Text>
          <Text style={s.sub}>Photographiez votre planning et importez vos evenements en un tap.</Text>
        </View>
        <TouchableOpacity style={s.btn} onPress={finish}>
          <Text style={s.btnText}>Commencer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}
const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  icon: { fontSize: 80, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#F0F0FF", textAlign: "center", marginBottom: 16 },
  sub: { fontSize: 16, color: "#666688", textAlign: "center", lineHeight: 26 },
  btn: { backgroundColor: "#6C63FF", borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
