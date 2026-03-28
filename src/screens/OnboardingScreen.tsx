import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    Linking,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Calendar from "expo-calendar";
import { useTranslation } from "react-i18next";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;

const PRIVACY_URL = "https://harleywallbanger.github.io/planning-to-calendar/privacy";
const TERMS_URL = "https://harleywallbanger.github.io/planning-to-calendar/terms";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Onboarding"> };

export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const finish = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await Calendar.requestCalendarPermissionsAsync();
    navigation.replace("Paywall");
  };

  const openPrivacy = () => {
    Linking.openURL(PRIVACY_URL).catch(() => {});
  };

  const openTerms = () => {
    Linking.openURL(TERMS_URL).catch(() => {});
  };

  return (
    <LinearGradient colors={["#0A0A0F", "#0F0F1A"]} style={s.container}>
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.icon}>📅</Text>
          <Text style={[s.title, isTablet && s.titleTablet]}>{t('onboarding.title')}</Text>
          <Text style={[s.sub, isTablet && s.subTablet]}>{t('onboarding.subtitle')}</Text>
        </View>

        <View style={[s.bottom, isTablet && s.bottomTablet]}>
          <TouchableOpacity
            style={[s.btn, isTablet && s.btnTablet]}
            onPress={finish}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#6C63FF", "#4F46E5"]}
              style={s.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[s.btnText, isTablet && s.btnTextTablet]}>{t('onboarding.start')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.legalRow}>
            <Text style={s.legalText}>En continuant, vous acceptez nos </Text>
            <TouchableOpacity onPress={openTerms} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Text style={s.legalLink}>CGU</Text>
            </TouchableOpacity>
            <Text style={s.legalText}> et notre </Text>
            <TouchableOpacity onPress={openPrivacy} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Text style={s.legalLink}>Politique de confidentialite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1, paddingHorizontal: isTablet ? 80 : 24, paddingBottom: 40 },
    center: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: isTablet ? 40 : 0,
    },
    icon: { fontSize: isTablet ? 120 : 80, marginBottom: 32 },
    title: {
          fontSize: 28,
          fontWeight: "800",
          color: "#F0F0FF",
          textAlign: "center",
          marginBottom: 16,
    },
    titleTablet: { fontSize: 40 },
    sub: {
          fontSize: 16,
          color: "#666688",
          textAlign: "center",
          lineHeight: 26,
    },
    subTablet: { fontSize: 20, lineHeight: 32, maxWidth: 560 },
    bottom: { gap: 16 },
    bottomTablet: { alignItems: "center" },
    btn: {
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: "#6C63FF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
    },
    btnTablet: { width: 420 },
    btnGradient: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 20,
    },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    btnTextTablet: { fontSize: 20 },
    legalRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 8,
    },
    legalText: { color: "#444466", fontSize: isTablet ? 13 : 11 },
    legalLink: {
          color: "#6C63FF",
          fontSize: isTablet ? 13 : 11,
          textDecorationLine: "underline",
          fontWeight: "600",
    },
});
