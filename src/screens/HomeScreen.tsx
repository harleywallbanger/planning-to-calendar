import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { extractEventsFromImage } from '../services/aiExtraction';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// Sur iPad, on limite la largeur du contenu pour eviter l'effet "trop etire"
const CONTENT_MAX_WIDTH = isTablet ? 600 : SCREEN_WIDTH;
const H_PADDING = isTablet ? 40 : 24;

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
        const pulse = Animated.loop(
                Animated.sequence([
                          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
                          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                        ])
              );
        pulse.start();
        return () => pulse.stop();
  }, []);

  const handlePickImage = async (fromCamera: boolean) => {
    if (fromCamera) {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('home.permission.title'), t('home.permission.camera'));
        return;
      }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      await analyzeImage(uri);
    }
  };

  const handleTestImage = async () => {
    const testUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Simple_English_Wikipedia_article.png/800px-Simple_English_Wikipedia_article.png';
    const localUri = FileSystem.cacheDirectory + 'test_planning.jpg';
    try {
      setIsLoading(true);
      setLoadingMessage(t('home.dev.loadingTest'));
      const { uri } = await FileSystem.downloadAsync(testUrl, localUri);
      setSelectedImage(uri);
      await analyzeImage(uri);
    } catch {
      Alert.alert(t('common.error'), t('home.dev.errorTest'));
      setIsLoading(false);
    }
  };

  const analyzeImage = async (uri: string) => {
    setIsLoading(true);
    setLoadingMessage(t('home.loading.analyzing'));
    try {
      setLoadingMessage(t('home.loading.detecting'));
      const events = await extractEventsFromImage(uri);
      if (events.length === 0) {
        Alert.alert(
          t('home.error.noEventsTitle'),
          t('home.error.noEventsMessage'),
          [{ text: t('home.error.retry'), onPress: () => setSelectedImage(null) }],
        );
        return;
      }
      setLoadingMessage(t('home.loading.found', { count: events.length }));
      navTimeoutRef.current = setTimeout(() => navigation.navigate('Preview', { events, imageUri: uri }), 600);
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        t('home.error.analyzeMessage', { message: error.message }),
        [{ text: t('common.ok'), onPress: () => setSelectedImage(null) }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const footerPills = ['Google Calendar', 'Apple Calendar', t('home.allApps')];

  const circleSize = isTablet ? 220 : 160;

  return (
    <LinearGradient colors={['#0A0A0F', '#0F0F1A', '#0A0A0F']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>{t('home.appName')}</Text>
          <Text style={styles.appSubtitle}>{t('home.appSubtitle')}</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Content centré et limité en largeur sur iPad */}
        <View style={styles.center}>
          <View style={[styles.innerContent, { maxWidth: CONTENT_MAX_WIDTH }]}>
            {isLoading ? (
              <View style={[styles.loadingContainer, { width: CONTENT_MAX_WIDTH - H_PADDING * 2 }]}>
                {selectedImage && (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.previewImageSmall}
                    blurRadius={2}
                  />
                )}
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#6C63FF" />
                  <Text style={styles.loadingText}>{loadingMessage}</Text>
                </View>
              </View>
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.scanCircle,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Text style={[styles.scanIcon, isTablet && styles.scanIconTablet]}>📅</Text>
                </Animated.View>

                <Text style={[styles.title, isTablet && styles.titleTablet]}>{t('home.title')}</Text>
                <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>{t('home.subtitle')}</Text>

                <View style={[styles.buttonContainer, isTablet && styles.buttonContainerTablet]}>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => handlePickImage(true)} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#6C63FF', '#4F46E5']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={[styles.primaryButtonText, isTablet && styles.primaryButtonTextTablet]}>
                        {t('home.takePhoto')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryButton} onPress={() => handlePickImage(false)} activeOpacity={0.85}>
                    <Text style={[styles.secondaryButtonText, isTablet && styles.secondaryButtonTextTablet]}>
                      {t('home.chooseGallery')}
                    </Text>
                  </TouchableOpacity>

                  {__DEV__ && (
                    <TouchableOpacity style={styles.devButton} onPress={handleTestImage} activeOpacity={0.85}>
                      <Text style={styles.devButtonText}>{t('home.dev.testButton')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {footerPills.map(label => (
            <View key={label} style={styles.featurePill}>
              <Text style={styles.featureText}>{label}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: H_PADDING },
  header: { paddingTop: 20, paddingBottom: 8 },
  appName: { fontSize: isTablet ? 16 : 13, fontWeight: '800', letterSpacing: 6, color: '#6C63FF' },
  appSubtitle: {
    fontSize: isTablet ? 13 : 11,
    letterSpacing: 4,
    color: '#444466',
    marginTop: 2,
    fontWeight: '600',
  },
  headerLine: { height: 1, backgroundColor: '#1A1A2E', marginTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  innerContent: { width: '100%', alignItems: 'center' },
  scanCircle: {
    borderWidth: 1.5,
    borderColor: '#6C63FF33',
    backgroundColor: '#6C63FF0A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  scanIcon: { fontSize: 52 },
  scanIconTablet: { fontSize: 80 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F0F0FF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  titleTablet: { fontSize: 36 },
  subtitle: {
    fontSize: 14,
    color: '#666688',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 44,
  },
  subtitleTablet: { fontSize: 18, lineHeight: 28, maxWidth: 480 },
  buttonContainer: { width: '100%', gap: 12 },
  buttonContainerTablet: { maxWidth: 440 },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 22 : 18,
    gap: 10,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  primaryButtonTextTablet: { fontSize: 19 },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    paddingVertical: isTablet ? 22 : 18,
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
  },
  secondaryButtonText: { color: '#8888AA', fontWeight: '600', fontSize: 15 },
  secondaryButtonTextTablet: { fontSize: 18 },
  loadingContainer: {
    height: isTablet ? 420 : 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111122',
  },
  previewImageSmall: { width: '100%', height: '100%', resizeMode: 'cover' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0F99',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { color: '#CCCCFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 24,
  },
  featurePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E30',
    backgroundColor: '#0F0F1A',
  },
  featureText: { color: '#444466', fontSize: isTablet ? 13 : 11, fontWeight: '500' },
  devButton: { borderRadius: 12, borderWidth: 1, borderColor: '#FF6B3544', paddingVertical: 14, alignItems: 'center', backgroundColor: '#1A0F0A' },
  devButtonText: { color: '#FF6B35', fontWeight: '600', fontSize: 13 },
});
