import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Success'> };

export default function SuccessScreen({ navigation }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={["#0A0A0F", "#0F0F1A", "#0A0A0F"]} style={s.container}>
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Animated.View style={[s.circle, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={["#6C63FF", "#4F46E5"]} style={s.gradient}>
              <Text style={s.check}>✓</Text>
            </LinearGradient>
          </Animated.View>
          <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
            <Text style={s.title}>Importe avec succes !</Text>
            <Text style={s.subtitle}>Vos evenements ont ete ajoutes a votre calendrier.</Text>
            <TouchableOpacity style={s.btn} onPress={() => navigation.popToTop()}>
              <Text style={s.btnText}>Scanner un autre planning</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  circle: { width: 120, height: 120, borderRadius: 60, overflow: "hidden", marginBottom: 32 },
  gradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  check: { fontSize: 52, color: "#fff" },
  title: { fontSize: 28, fontWeight: "700", color: "#F0F0FF", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#666688", textAlign: "center", lineHeight: 22, marginBottom: 48 },
  btn: { backgroundColor: "#111122", borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16, borderWidth: 1, borderColor: "#6C63FF44" },
  btnText: { color: "#6C63FF", fontWeight: "700", fontSize: 15 },
});
