import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, SafeAreaView, ScrollView, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PurchasesPackage } from 'react-native-purchases';
import { RootStackParamList } from '../../App';
import {
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
} from '../services/purchaseService';
import { useTranslation } from 'react-i18next';

type SubscriptionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Subscription'>;
};

const FEATURE_ICONS = ['📸', '🤖', '📅', '📤', '👨‍👩‍👧‍👦'];

export default function SubscriptionScreen({ navigation }: SubscriptionScreenProps) {
  const { t } = useTranslation();
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const features = (t('paywall.features', { returnObjects: true }) as string[]).map(
    (label, i) => ({ icon: FEATURE_ICONS[i], label }),
  );

  useEffect(() => {
    loadOffering();
  }, []);

  const loadOffering = async () => {
    const offering = await getCurrentOffering();
    if (offering?.monthly) {
      setMonthlyPackage(offering.monthly);
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSubscribe = async () => {
    if (!monthlyPackage) return;
    setIsPurchasing(true);
    try {
      const success = await purchasePackage(monthlyPackage);
      if (success) {
        navigation.replace('Home');
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(t('common.error'), t('paywall.error.purchase'));
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        navigation.replace('Home');
      } else {
        Alert.alert(t('paywall.error.restoreNoneTitle'), t('paywall.error.restoreNoneMessage'));
      }
    } catch {
      Alert.alert(t('common.error'), t('paywall.error.restoreFailed'));
    } finally {
      setIsRestoring(false);
    }
  };

  const priceLabel = monthlyPackage?.product.priceString ?? '2,99 €';

  return (
    <LinearGradient colors={['#0A0A0F', '#0D0D1A', '#0A0A0F']} style={s.container}>
      <SafeAreaView style={s.safe}>

        {/* Close button — toujours visible, Apple guideline */}
        <TouchableOpacity
          style={s.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Text style={s.closeIcon}>✕</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.emoji}>📅</Text>
            <Text style={s.title}>{t('paywall.title')}</Text>
            <Text style={s.subtitle}>{t('paywall.subtitle')}</Text>
          </View>

          {/* Trial badge */}
          <LinearGradient colors={['#6C63FF22', '#6C63FF11']} style={s.trialBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.trialBadgeText}>{t('paywall.trialBadge')}</Text>
          </LinearGradient>

          {/* Features */}
          <View style={s.featuresBlock}>
            {features.map((f) => (
              <View key={f.label} style={s.featureRow}>
                <View style={s.featureIconWrap}>
                  <Text style={s.featureIcon}>{f.icon}</Text>
                </View>
                <Text style={s.featureLabel}>{f.label}</Text>
                <Text style={s.checkmark}>✓</Text>
              </View>
            ))}
          </View>

          {/* Price card */}
          <View style={s.priceCard}>
            <View style={s.priceCardTop}>
              <View>
                <Text style={s.planName}>{t('paywall.planName')}</Text>
                <Text style={s.trialNote}>{t('paywall.trialNote')}</Text>
              </View>
              <View style={s.priceRight}>
                <Text style={s.price}>{priceLabel}</Text>
                <Text style={s.pricePer}>{t('paywall.pricePer')}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <Text style={s.familyNote}>{t('paywall.familyNote')}</Text>
          </View>

          {/* CTA */}
          {isLoading ? (
            <ActivityIndicator color="#6C63FF" style={{ marginVertical: 24 }} />
          ) : (
            <View style={[s.ctaButtonShadow, (isPurchasing || !monthlyPackage) && s.ctaDisabled]}>
              <TouchableOpacity
                style={s.ctaButton}
                onPress={handleSubscribe}
                disabled={isPurchasing || !monthlyPackage}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#6C63FF', '#4F46E5']} style={s.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  {isPurchasing
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.ctaText}>{t('paywall.cta')}</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <Text style={s.ctaCaption}>{t('paywall.ctaCaption')}</Text>

          {/* Restore */}
          <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={s.restoreButton}>
            {isRestoring
              ? <ActivityIndicator color="#444466" size="small" />
              : <Text style={s.restoreText}>{t('paywall.restore')}</Text>
            }
          </TouchableOpacity>

          {/* Legal */}
          <Text style={s.legal}>
            {t('paywall.legal', { price: priceLabel })}
          </Text>

          {/* Links */}
          <View style={s.linksRow}>
            <TouchableOpacity onPress={() => Linking.openURL('https://harleywallbanger.github.io/planning-to-calendar/privacy.html')}>
              <Text style={s.linkText}>{t('paywall.privacy')}</Text>
            </TouchableOpacity>
            <Text style={s.linkSeparator}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://harleywallbanger.github.io/planning-to-calendar/terms.html')}>
              <Text style={s.linkText}>{t('paywall.terms')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: { color: '#8888AA', fontSize: 16, fontWeight: '700' },

  scroll: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40, maxWidth: 600, alignSelf: 'center', width: '100%' },

  header: { alignItems: 'center', marginBottom: 28 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#F0F0FF', textAlign: 'center', letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666688', textAlign: 'center', lineHeight: 22 },

  trialBadge: { borderRadius: 12, borderWidth: 1, borderColor: '#6C63FF33', paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', marginBottom: 28 },
  trialBadgeText: { color: '#8B84FF', fontWeight: '700', fontSize: 15 },

  featuresBlock: { gap: 14, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#6C63FF15', justifyContent: 'center', alignItems: 'center' },
  featureIcon: { fontSize: 16 },
  featureLabel: { flex: 1, color: '#CCCCEE', fontSize: 14, fontWeight: '500' },
  checkmark: { color: '#6C63FF', fontWeight: '800', fontSize: 16 },

  priceCard: { backgroundColor: '#111122', borderRadius: 16, borderWidth: 1, borderColor: '#1E1E30', padding: 18, marginBottom: 24 },
  priceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { color: '#F0F0FF', fontWeight: '700', fontSize: 16 },
  trialNote: { color: '#6C63FF', fontSize: 12, fontWeight: '600', marginTop: 3 },
  priceRight: { alignItems: 'flex-end' },
  price: { color: '#F0F0FF', fontSize: 22, fontWeight: '800' },
  pricePer: { color: '#666688', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#1E1E30', marginVertical: 14 },
  familyNote: { color: '#666688', fontSize: 13 },

  ctaButtonShadow: { borderRadius: 16, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, marginBottom: 12 },
  ctaButton: { borderRadius: 16, overflow: 'hidden' },
  ctaDisabled: { opacity: 0.7 },
  ctaGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.2 },
  ctaCaption: { color: '#444466', fontSize: 12, textAlign: 'center', marginBottom: 20 },

  restoreButton: { alignItems: 'center', paddingVertical: 12, marginBottom: 20 },
  restoreText: { color: '#444466', fontSize: 13, textDecorationLine: 'underline' },

  legal: { color: '#2E2E44', fontSize: 10, textAlign: 'center', lineHeight: 15, marginBottom: 12 },

  linksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  linkText: { color: '#8888BB', fontSize: 12, textDecorationLine: 'underline' },
  linkSeparator: { color: '#555577', fontSize: 12 },
});
