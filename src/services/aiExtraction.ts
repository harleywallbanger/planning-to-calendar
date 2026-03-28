import { CalendarEvent } from '../../App';
import { File } from 'expo-file-system/next';

const API_URL = 'https://planning-api-ivory.vercel.app/api/analyze';

export async function extractEventsFromImage(imageUri: string): Promise<CalendarEvent[]> {
  if (!imageUri) throw new Error('URI image manquante');

  let base64Image: string;
  try {
    const file = new File(imageUri);
    base64Image = await file.base64();
  } catch (e: any) {
    throw new Error('Lecture image: ' + e.message);
  }

  if (!base64Image || base64Image.length < 10) {
    throw new Error('Image vide');
  }

  const prompt = 'Analyze this planning image and extract ALL events. Return ONLY a JSON object with this exact structure: {"events":[{"id":"1","title":"Meeting","date":"2026-03-15","startTime":"09:00","endTime":"10:00","location":"","notes":""}]}';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
          { type: 'text', text: prompt }
        ]}]
      })
    });
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('Délai dépassé (30s). Vérifiez votre connexion.');
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error('API ' + response.status + ': ' + err);
  }
  const data = await response.json();
  const text: string = data.content.map((b: any) => b.type === 'text' ? b.text : '').join('');

  // Extraction JSON robuste : cherche le premier bloc {...} ou [{...}]
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn('[aiExtraction] Réponse inattendue:', text.slice(0, 200));
    return [];
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed.events) ? parsed.events : [];
  } catch (e) {
    console.warn('[aiExtraction] Parsing JSON échoué:', jsonMatch[0].slice(0, 200));
    return [];
  }
}
