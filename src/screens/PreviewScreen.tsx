import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, CalendarEvent } from '../../App';
import { addEventsToDeviceCalendar, exportAsICS, openInGoogleCalendar } from '../services/calendarService';
import { LinearGradient } from 'expo-linear-gradient';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Preview'>; route: RouteProp<RootStackParamList, 'Preview'>; };

export default function PreviewScreen({ navigation, route }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>(route.params.events);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState('');

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Retirer cet evenement ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setEvents(prev => prev.filter(e => e.id !== id)) },
    ]);
  };

  const handleAddToCalendar = async () => {
    setIsImporting(true); setImportMode('device');
    try { await addEventsToDeviceCalendar(events); navigation.navigate('Success'); }
    catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setIsImporting(false); }
  };

  const handleExportICS = async () => {
    setIsImporting(true); setImportMode('ics');
    try { await exportAsICS(events); }
    catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setIsImporting(false); }
  };

  const handleGoogle = async () => {
    if (events.length === 1) { await openInGoogleCalendar(events[0]); }
    else { Alert.alert('Google Calendar', 'Un fichier .ics sera partage.', [{ text: 'Annuler', style: 'cancel' }, { text: 'OK', onPress: handleExportICS }]); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const colors = ['#6C63FF', '#FF6B9D', '#4ECDC4', '#FFD93D', '#A8E6CF'];

  return (
    <LinearGradient colors={['#0A0A0F', '#0F0F1A', '#0A0A0F']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>Retour</Text></TouchableOpacity>
          <View><Text style={s.headerTitle}>{events.length} evenement{events.length > 1 ? 's' : ''}</Text><Text style={s.headerSub}>Verifiez avant d importation</Text></View>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
          {events.map((event, i) => (
            <View key={event.id} style={s.card}>
              <View style={[s.accent, { backgroundColor: colors[i % colors.length] }]} />
              <View style={{ flex: 1, padding: 14 }}>
                <Text style={s.title}>{event.title}</Text>
                <Text style={s.date}>{formatDate(event.date)}</Text>
                <Text style={s.time}>{event.startTime} - {event.endTime}</Text>
                {event.location ? <Text style={s.sub}>{event.location}</Text> : null}
              </View>
              <View style={{ justifyContent: 'center', gap: 4, padding: 10 }}>
                <TouchableOpacity onPress={() => { setEditingEvent({...event}); setEditModalVisible(true); }} style={{ padding: 8 }}><Text style={{ fontSize: 18 }}>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(event.id)} style={{ padding: 8 }}><Text style={{ fontSize: 18 }}>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 220 }} />
        </ScrollView>
        <View style={s.panel}>
          <Text style={s.panelTitle}>AJOUTER AU CALENDRIER</Text>
          <TouchableOpacity style={{ borderRadius: 14, overflow: 'hidden' }} onPress={handleAddToCalendar} disabled={isImporting}>
            <LinearGradient colors={['#6C63FF', '#4F46E5']} style={{ paddingVertical: 16, alignItems: 'center' }}>
              {isImporting && importMode === 'device' ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Calendrier de l appareil</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[s.smallBtn, { borderColor: '#EA4335' }]} onPress={handleGoogle} disabled={isImporting}><Text style={s.smallBtnText}>Google Cal</Text></TouchableOpacity>
            <TouchableOpacity style={[s.smallBtn, { borderColor: '#2A2A3E' }]} onPress={handleExportICS} disabled={isImporting}>
              {isImporting && importMode === 'ics' ? <ActivityIndicator color="#6C63FF" size="small" /> : <Text style={s.smallBtnText}>Exporter .ics</Text>}
            </TouchableOpacity>
          </View>
        </View>
        <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalVisible(false)}>
          <LinearGradient colors={['#0F0F1A', '#0A0A0F']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#1A1A2E' }}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}><Text style={{ color: '#666688', fontSize: 16 }}>Annuler</Text></TouchableOpacity>
                <Text style={{ color: '#F0F0FF', fontSize: 17, fontWeight: '700' }}>Modifier</Text>
                <TouchableOpacity onPress={() => { if (!editingEvent) return; setEvents(prev => prev.map(e => e.id === editingEvent.id ? editingEvent : e)); setEditModalVisible(false); }}><Text style={{ color: '#6C63FF', fontSize: 16, fontWeight: '700' }}>Enregistrer</Text></TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 20 }}>
                {editingEvent && [['Titre','title'],['Date (YYYY-MM-DD)','date'],['Debut (HH:MM)','startTime'],['Fin (HH:MM)','endTime'],['Lieu','location'],['Notes','notes']].map(([label, key]) => (
                  <View key={key} style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#6C63FF', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
                    <TextInput style={{ backgroundColor: '#111122', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A3E', color: '#F0F0FF', padding: 14, fontSize: 15 }} value={(editingEvent as any)[key] || ''} onChangeText={v => setEditingEvent({ ...editingEvent, [key]: v })} placeholderTextColor="#444466" />
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#1A1A2E' },
  back: { color: '#6C63FF', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#F0F0FF', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#444466', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: '#0F0F1A', borderRadius: 16, borderWidth: 1, borderColor: '#1E1E30', marginBottom: 12, flexDirection: 'row', overflow: 'hidden' },
  accent: { width: 4 },
  title: { color: '#F0F0FF', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  date: { color: '#6C63FF', fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  time: { color: '#8888AA', fontSize: 13 },
  sub: { color: '#8888AA', fontSize: 13, marginTop: 4 },
  panel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0A0A0F', borderTopWidth: 1, borderColor: '#1A1A2E', padding: 20, paddingBottom: 34, gap: 10 },
  panelTitle: { color: '#444466', fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textAlign: 'center', marginBottom: 4 },
  smallBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: 'center', backgroundColor: '#0F0F1A' },
  smallBtnText: { color: '#8888AA', fontWeight: '600', fontSize: 13 },
});
