import { CalendarEvent } from '../../App';
import * as Calendar from 'expo-calendar';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Platform } from 'react-native';

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

async function getOrCreateAppCalendar(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find(c => c.title === 'Planning Import');
  if (existing) return existing.id;
  const defaultCalendar = calendars.find(c =>
    Platform.OS === 'ios'
      ? c.source?.name === 'iCloud' || c.source?.name === 'Default'
      : c.accessLevel === Calendar.CalendarAccessLevel.OWNER
  );
  const source = defaultCalendar?.source ?? { isLocalAccount: true, name: 'Planning Import', type: 'local' };
  return await Calendar.createCalendarAsync({
    title: 'Planning Import',
    color: '#6C63FF',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCalendar?.source?.id,
    source: source as any,
    name: 'Planning Import',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export async function addEventsToDeviceCalendar(events: CalendarEvent[]): Promise<{ success: number; failed: number }> {
  const hasPermission = await requestCalendarPermission();
  if (!hasPermission) throw new Error('Permission calendrier refusée');
  const calendarId = await getOrCreateAppCalendar();
  let success = 0, failed = 0;
  for (const event of events) {
    try {
      const startDate = parseEventDateTime(event.date, event.startTime);
      const endDate = parseEventDateTime(event.date, event.endTime);
      await Calendar.createEventAsync(calendarId, {
        title: event.title, startDate, endDate,
        location: event.location || undefined,
        notes: event.notes || undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      success++;
    } catch (e) { console.warn('[calendarService] Échec ajout événement:', e); failed++; }
  }
  return { success, failed };
}

export async function openInGoogleCalendar(event: CalendarEvent): Promise<void> {
  const start = formatGoogleDateTime(event.date, event.startTime);
  const end = formatGoogleDateTime(event.date, event.endTime);
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${start}/${end}`, details: event.notes || '', location: event.location || '' });
  await Linking.openURL(`https://calendar.google.com/calendar/render?${params.toString()}`);
}

export async function exportAsICS(events: CalendarEvent[]): Promise<void> {
  const icsContent = generateICSContent(events);
  const fileUri = `${FileSystem.cacheDirectory}planning_${Date.now()}.ics`;
  await FileSystem.writeAsStringAsync(fileUri, icsContent, { encoding: FileSystem.EncodingType.UTF8 });
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) throw new Error("Le partage n'est pas disponible");
  await Sharing.shareAsync(fileUri, { mimeType: 'text/calendar', dialogTitle: 'Importer dans votre calendrier', UTI: 'public.calendar-event' });
}

function generateICSContent(events: CalendarEvent[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const eventBlocks = events.map(event => [
    'BEGIN:VEVENT',
    `UID:${event.id}-${Date.now()}@planningimport`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDateTime(event.date, event.startTime)}`,
    `DTEND:${formatICSDateTime(event.date, event.endTime)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.location ? `LOCATION:${escapeICS(event.location)}` : '',
    event.notes ? `DESCRIPTION:${escapeICS(event.notes)}` : '',
    'END:VEVENT',
  ].filter(Boolean).join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Planning Import//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...eventBlocks, 'END:VCALENDAR'].join('\r\n');
}

function parseEventDateTime(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatICSDateTime(dateStr: string, timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0];
}

function formatGoogleDateTime(dateStr: string, timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICS(str: string): string {
  return str.replace(/[\\;,]/g, match => '\\' + match).replace(/\n/g, '\\n');
}
