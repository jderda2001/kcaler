import Anthropic from '@anthropic-ai/sdk';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SYSTEM_PROMPT = `Jesteś parserem etykiet wartości odżywczych. Wyciągnij dane z etykiety produktu spożywczego na obrazku.

Zwróć WYŁĄCZNIE poprawny JSON o dokładnie takiej strukturze:
{
  "name": string,
  "unit": "g" | "ml",
  "per_100": {
    "kcal": number,
    "fat": number,
    "saturated_fat": number | null,
    "carbs_total": number,
    "sugars": number | null,
    "fiber": number | null,
    "protein": number,
    "salt": number | null
  },
  "confidence": "high" | "medium" | "low"
}

Zasady:
- Używaj kolumny "na 100 g" lub "na 100 ml" (nie porcji)
- Jeśli widoczna tylko porcja, przelicz proporcjonalnie do 100
- Wartości "<0,5 g", "<0,1 g" itp. zwróć jako 0
- Jeśli wartość nie jest widoczna / nieczytelna → null (NIE 0)
- Polskie nazwy: "Wartość energetyczna" = kcal, "Tłuszcz" = fat, "w tym kwasy nasycone" = saturated_fat, "Węglowodany" = carbs_total, "w tym cukry" = sugars, "Błonnik" = fiber, "Białko" = protein, "Sól" = salt
- name: nazwa produktu jeśli widoczna na etykiecie, inaczej pusty string
- unit: "ml" dla napojów/płynów, "g" dla reszty
- confidence: "high" jeśli wszystkie główne wartości czytelne; "medium" jeśli częściowo wywnioskowane; "low" jeśli mocno zgadywane
- Energia: jeśli widać tylko kJ, przelicz na kcal (1 kcal ≈ 4.184 kJ)

Zwróć TYLKO JSON, bez markdown, bez komentarzy, bez backticków.`;

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Brak klucza API. Skonfiguruj ANTHROPIC_API_KEY w .env.local.' },
      { status: 500 },
    );
  }

  let image: string | undefined;
  try {
    const body = (await req.json()) as { image?: string };
    image = body.image;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe ciało żądania.' }, { status: 400 });
  }

  if (!image) {
    return NextResponse.json({ error: 'Brak obrazu.' }, { status: 400 });
  }

  const match = image.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: 'Niewspierany format obrazu. Wymagane: jpeg, png, webp lub gif.' },
      { status: 400 },
    );
  }

  const mediaType = match[1] as ImageMediaType;
  const base64Data = match[2];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data },
            },
            {
              type: 'text',
              text: 'Wyciągnij wartości odżywcze z tej etykiety.',
            },
          ],
        },
      ],
    });

    const first = response.content[0];
    const text = first && first.type === 'text' ? first.text.trim() : '';
    if (!text) {
      return NextResponse.json({ error: 'Pusta odpowiedź modelu.' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Nie udało się sparsować odpowiedzi modelu.', raw: text },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('scan-label error', message);
    return NextResponse.json({ error: 'Scan failed', details: message }, { status: 500 });
  }
}
