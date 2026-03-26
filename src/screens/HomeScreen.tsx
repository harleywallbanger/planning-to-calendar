import React, { useState, useRef } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { extractEventsFromImage } from '../services/aiExtraction';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

// Sur iPad, on limite la largeur du contenu pour eviter l'effet "trop etire"
const CONTENT_MAX_WIDTH = isTablet ? 600 : SCREEN_WIDTH;
const H_PADDING = isTablet ? 40 : 24;

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

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
        const permissionResult = fromCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
                Alert.alert(
                          'Permission requise',
                          fromCamera
                            ? "L'acces a la camera est necessaire."
                            : "L'acces a la galerie est necessaire."
                        );
                return;
        }

        const result = fromCamera
          ? await ImagePicker.launchCameraAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.9,
                      allowsEditing: true,
          })
                : await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.9,
                            allowsEditing: true,
                });

        if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setSelectedImage(uri);
                await analyzeImage(uri);
        }
  };

  const analyzeImage = async (uri: string) => {
        setIsLoading(true);
        setLoadingMessage("Analyse de l'image en cours...");
        try {
                setLoadingMessage('Detection des evenements...');
                const events = await extractEventsFromImage(uri);
                if (events.length === 0) {
                          Alert.alert('Aucun evenement trouve', "Essayez avec une photo plus nette.", [
                            { text: 'Reessayer', onPress: () => setSelectedImage(null) },
                                    ]);
                          return;
                }
                setLoadingMessage(`${events.length} evenement(s) trouve(s) !`);
                setTimeout(() => navigation.navigate('Preview', { events, imageUri: uri }), 600);
        } catch (error: any) {
                Alert.alert('Erreur', `Impossible d'analyser l'image: ${error.message}`, [
                  { text: 'OK', onPress: () => setSelectedImage(null) },
                        ]);
        } finally {
                setIsLoading(false);
        }
  };

  const circleSize = isTablet ? 220 : 160;

  return (
        <LinearGradient colors={['#0A0A0F', '#0F0F1A', '#0A0A0F']} style={styles.container}>
                <SafeAreaView style={styles.safe}>
                  {/* Header */}
                          <View style={styles.header}>
                                      <Text style={styles.appName}>PLANNING</Text>Text>
                                      <Text style={styles.appSubtitle}>CALENDRIER</Text>Text>
                                      <View style={styles.headerLine} />
                          </View>View>

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
                                                              <Text style={styles.loadingText}>{loadingMessage}</Text>Text>
                                          </View>View>
                        </View>View>
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
                                                          <Text style={[styles.scanIcon, isTablet && styles.scanIconTablet]}>📅</Text>Text>
                                        </Animated.View>Animated.View>
                        
                                        <Text style={[styles.title, isTablet && styles.titleTablet]}>
                                                          Scannez votre planning
                                        </Text>Text>
                                        <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
                                                          L'IA extrait automatiquement tous vos evenements et les ajoute a votre calendrier
                                        </Text>Text>
                        
                                        <View style={[styles.buttonContainer, isTablet && styles.buttonContainerTablet]}>
                                                          <TouchableOpacity
                                                                                style={styles.primaryButton}
                                                                                onPress={() => handlePickImage(true)}
                                                                                activeOpacity={0.85}
                                                                              >
                                                                              <LinearGradient
                                                                                                      colors={['#6C63FF', '#4F46E5']}
                                                                                                      style={styles.buttonGradient}
                                                                                                      start={{ x: 0, y: 0 }}
                                                                                                      end={{ x: 1, y: 1 }}
                                                                                                    >
                                                                                                    <Text style={[styles.primaryButtonText, isTablet && styles.primaryButtonTextTablet]}>
                                                                                                                            Prendre une photo
                                                                                                      </Text>Text>
                                                                              </LinearGradient>LinearGradient>
                                                          </TouchableOpacity>TouchableOpacity>
                                        
                                                          <TouchableOpacity
                                                                                style={styles.secondaryButton}
                                                                                onPress={() => handlePickImage(false)}
                                                                                activeOpacity={0.85}
                                                                              >
                                                                              <Text style={[styles.secondaryButtonText, isTablet && styles.secondaryButtonTextTablet]}>
                                                                                                    Choisir depuis la galerie
                                                                              </Text>Text>
                                                          </TouchableOpacity>TouchableOpacity>
                                        </View>View>
                        </>>
                      )}
                                      </View>View>
                          </View>View>
                
                  {/* Footer */}
                        <View style={styles.footer}>
                          {['Google Calendar', 'Apple Calendar', '+ Toutes les apps'].map((label) => (
                      <View key={label} style={styles.featurePill}>
                                    <Text style={styles.featureText}>{label}</Text>Text>
                      </View>View>
                    ))}
                        </View>View>
                </SafeAreaView>SafeAreaView>
        </LinearGradient>LinearGradient>
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
});</>
