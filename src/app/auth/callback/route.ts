import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    // Intercambia el código que mandó Google por la sesión activa
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirige al inicio ya con la sesión guardada
  return NextResponse.redirect(`${origin}/`);
}