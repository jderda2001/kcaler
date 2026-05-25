import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db, schema } from '@/db';

export const runtime = 'nodejs';

interface RegisterPayload {
  email?: string;
  password?: string;
  name?: string;
}

export async function POST(req: NextRequest) {
  let body: RegisterPayload;
  try {
    body = (await req.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe żądanie' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  const name = body.name?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Nieprawidłowy adres email' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Hasło musi mieć co najmniej 8 znaków' },
      { status: 400 },
    );
  }

  try {
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Konto z tym emailem już istnieje. Spróbuj się zalogować.' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(schema.users).values({
      email,
      name,
      passwordHash,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('register error', err);
    return NextResponse.json(
      { error: 'Nie udało się utworzyć konta. Spróbuj ponownie.' },
      { status: 500 },
    );
  }
}
