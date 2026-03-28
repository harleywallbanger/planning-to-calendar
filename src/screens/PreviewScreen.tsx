import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
    Modal,
    SafeAreaView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, CalendarEvent } from '../../App';
import { addEventsToDeviceCalendar, exportAsICS, openInGoogleCalendar } from '../services/calendarService';
import { checkSubscriptionStatus } from '../services/purchaseService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const H_PADDING = isTablet ? 40 : 20;
const PANEL_BOTTOM_PADDING = isTablet ? 40 : 34;

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Preview'>;
    route: RouteProp<RootStackParamList, 'Preview'>;
};

export default function PreviewScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<CalendarEvent[]>(route.params.events);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState('');

  const handleDelete = (id: string) => {
    Alert.alert(t('preview.delete.title'), t('preview.delete.confirm'), [
      { text: t('preview.modal.cancel'), style: 'cancel' },
      { text: t('preview.delete.button'), style: 'destructive', onPress: () => setEvents(prev => prev.filter(e => e.id !== id)) },
    ]);
  };

  const requireSubscription = async (): Promise<boolean> => {
    const subscribed = await checkSubscriptionStatus();
    if (!subscribed) {
      navigation.navigate('Subscription');
      return false;
    }
    return true;
  };

  const handleAddToCalendar = async () => {
    if (!await requireSubscription()) return;
    setIsImporting(true);
    setImportMode('device');
    try {
      await addEventsToDeviceCalendar(events);
      navigation.navigate('Success');
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportICS = async () => {
    if (!await requireSubscription()) return;
    setIsImporting(true);
    setImportMode('ics');
    try {
      await exportAsICS(events);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleGoogle = async () => {
    if (events.length === 1) {
      await openInGoogleCalendar(events[0]);
    } else {
      Alert.alert(t('preview.google.title'), t('preview.google.message'), [
        { text: t('preview.modal.cancel'), style: 'cancel' },
        { text: t('common.ok'), onPress: handleExportICS },
      ]);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });

  const colors = ['#6C63FF', '#FF6B9D', '#4ECDC4', '#FFD93D', '#A8E6CF'];
  const panelHeight = isTablet ? 180 : 160;

  const editFields: [string, keyof CalendarEvent][] = [
    [t('preview.fields.title'), 'title'],
    [t('preview.fields.date'), 'date'],
    [t('preview.fields.startTime'), 'startTime'],
    [t('preview.fields.endTime'), 'endTime'],
    [t('preview.fields.location'), 'location'],
    [t('preview.fields.notes'), 'notes'],
  ];

  const eventCountKey = events.length === 1 ? 'preview.eventCount_one' : 'preview.eventCount_other';

  return (
    <LinearGradient colors={['#0A0A0F', '#0F0F1A', '#0A0A0F']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.back}>{t('preview.back')}</Text>
          </TouchableOpacity>
          <View>
            <Text style={[s.headerTitle, isTablet && s.headerTitleTablet]}>
              {t(eventCountKey, { count: events.length })}
            </Text>
            <Text style={s.headerSub}>{t('preview.checkBefore')}</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scrollContent, { paddingBottom: panelHeight + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[s.listWrapper, isTablet && s.listWrapperTablet]}>
            {events.map((event, i) => (
              <View key={event.id} style={s.card}>
                <View style={[s.accent, { backgroundColor: colors[i % colors.length] }]} />
                <View style={{ flex: 1, padding: isTablet ? 18 : 14 }}>
                  <Text style={[s.cardTitle, isTablet && s.cardTitleTablet]}>{event.title}</Text>
                  <Text style={[s.date, isTablet && s.dateTablet]}>{formatDate(event.date)}</Text>
                  <Text style={[s.time, isTablet && s.timeTablet]}>{event.startTime} - {event.endTime}</Text>
                  {event.location ? <Text style={[s.sub, isTablet && s.subTablet]}>{event.location}</Text> : null}
                </View>
                <View style={{ justifyContent: 'center', gap: 4, padding: 10 }}>
                  <TouchableOpacity
                    onPress={() => { setEditingEvent({ ...event }); setEditModalVisible(true); }}
                    style={s.iconBtn}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={{ fontSize: 18 }}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(event.id)}
                    style={s.iconBtn}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[s.panel, { paddingBottom: PANEL_BOTTOM_PADDING }]}>
          <View style={[s.panelInner, isTablet && s.panelInnerTablet]}>
            <Text style={s.panelTitle}>{t('preview.addToCalendar')}</Text>
            <TouchableOpacity
              style={{ borderRadius: 14, overflow: 'hidden' }}
              onPress={handleAddToCalendar}
              disabled={isImporting}
            >
              <LinearGradient
                colors={['#6C63FF', '#4F46E5']}
                style={{ paddingVertical: isTablet ? 18 : 16, alignItems: 'center' }}
              >
                {isImporting && importMode === 'device' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[s.mainBtnText, isTablet && s.mainBtnTextTablet]}>
                    {t('preview.deviceCalendar')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[s.smallBtn, { borderColor: '#EA4335' }]}
                onPress={handleGoogle}
                disabled={isImporting}
              >
                <Text style={[s.smallBtnText, isTablet && s.smallBtnTextTablet]}>{t('preview.googleCal')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.smallBtn, { borderColor: '#2A2A3E' }]}
                onPress={handleExportICS}
                disabled={isImporting}
              >
                {isImporting && importMode === 'ics' ? (
                  <ActivityIndicator color="#6C63FF" size="small" />
                ) : (
                  <Text style={[s.smallBtnText, isTablet && s.smallBtnTextTablet]}>{t('preview.exportIcs')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Modal
          visible={editModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <LinearGradient colors={['#0F0F1A', '#0A0A0F']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={s.modalCancel}>{t('preview.modal.cancel')}</Text>
                </TouchableOpacity>
                <Text style={[s.modalHeaderTitle, isTablet && s.modalHeaderTitleTablet]}>{t('preview.modal.title')}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!editingEvent) return;
                    setEvents(prev => prev.map(e => e.id === editingEvent.id ? editingEvent : e));
                    setEditModalVisible(false);
                  }}
                >
                  <Text style={s.modalSave}>{t('preview.modal.save')}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: isTablet ? 32 : 20 }}>
                {editingEvent && editFields.map(([label, key]) => (
                  <View key={key} style={{ marginBottom: 20 }}>
                    <Text style={[s.inputLabel, isTablet && s.inputLabelTablet]}>{label}</Text>
                    <TextInput
                      style={[s.input, isTablet && s.inputTablet]}
                      value={(editingEvent as any)[key] || ''}
                      onChangeText={v => setEditingEvent({ ...editingEvent, [key]: v })}
                      placeholderTextColor="#444466"
                    />
                  </View>
                ))}
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
    header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: H_PADDING,
          paddingTop: 12,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderColor: '#1A1A2E',
    },
    back: { color: '#6C63FF', fontSize: isTablet ? 17 : 15, fontWeight: '600' },
    headerTitle: { color: '#F0F0FF', fontSize: 18, fontWeight: '700' },
    headerTitleTablet: { fontSize: 24 },
    headerSub: { color: '#444466', fontSize: isTablet ? 13 : 12, marginTop: 2 },
    scrollContent: { paddingHorizontal: H_PADDING, paddingTop: 16 },
    listWrapper: { width: '100%' },
    listWrapperTablet: { maxWidth: 700, alignSelf: 'center', width: '100%' },
    card: {
          backgroundColor: '#0F0F1A',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#1E1E30',
          marginBottom: 12,
          flexDirection: 'row',
          overflow: 'hidden',
    },
    accent: { width: 4 },
    cardTitle: { color: '#F0F0FF', fontSize: 15, fontWeight: '700', marginBottom: 4 },
    cardTitleTablet: { fontSize: 18 },
    date: { color: '#6C63FF', fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
    dateTablet: { fontSize: 14 },
    time: { color: '#8888AA', fontSize: 13 },
    timeTablet: { fontSize: 15 },
    sub: { color: '#8888AA', fontSize: 13, marginTop: 4 },
    subTablet: { fontSize: 15 },
    iconBtn: { padding: 8 },
    iconBtnText: { fontSize: 12, color: '#6C63FF', fontWeight: '700' },
    iconBtnDel: { fontSize: 12, color: '#FF6B9D', fontWeight: '700' },
    iconBtnTextTablet: { fontSize: 15 },
    panel: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0A0A0F',
          borderTopWidth: 1,
          borderColor: '#1A1A2E',
          padding: 20,
    },
    panelInner: { gap: 10 },
    panelInnerTablet: { maxWidth: 600, alignSelf: 'center', width: '100%' },
    panelTitle: {
          color: '#444466',
          fontSize: isTablet ? 12 : 11,
          fontWeight: '600',
          letterSpacing: 1.5,
          textAlign: 'center',
          marginBottom: 4,
    },
    mainBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    mainBtnTextTablet: { fontSize: 18 },
    smallBtn: {
          flex: 1,
          paddingVertical: isTablet ? 15 : 13,
          borderRadius: 14,
          borderWidth: 1,
          alignItems: 'center',
          backgroundColor: '#0F0F1A',
    },
    smallBtnText: { color: '#8888AA', fontWeight: '600', fontSize: 13 },
    smallBtnTextTablet: { fontSize: 16 },
    modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isTablet ? 24 : 20,
          borderBottomWidth: 1,
          borderColor: '#1A1A2E',
    },
    modalCancel: { color: '#666688', fontSize: isTablet ? 18 : 16 },
    modalHeaderTitle: { color: '#F0F0FF', fontSize: 17, fontWeight: '700' },
    modalHeaderTitleTablet: { fontSize: 22 },
    modalSave: { color: '#6C63FF', fontSize: isTablet ? 18 : 16, fontWeight: '700' },
    inputLabel: { color: '#6C63FF', fontSize: 12, fontWeight: '600', marginBottom: 8 },
    inputLabelTablet: { fontSize: 14 },
    input: {
          backgroundColor: '#111122',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#2A2A3E',
          color: '#F0F0FF',
          padding: 14,
          fontSize: 15,
    },
    inputTablet: { fontSize: 17, padding: 18 },
});
