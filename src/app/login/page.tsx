'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Inicializamos Supabase para el cliente
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Error al iniciar sesión: Verifica tu correo y contraseña.');
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', data.user.id)
        .single();

      const rol = perfil?.rol;
      
      // LA VALIDACIÓN CON TU CORREO CORRECTO
      const esSuperAdmin = data.user.email === 'juancamilo.lopez.0510@gmail.com';

      setTimeout(() => {
        if (rol === 'admin' || esSuperAdmin) {
          window.location.href = '/admin'; 
        } else if (rol === 'cajero') {
          window.location.href = '/cajero';
        } else {
          window.location.href = '/';
        }
      }, 500); 
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white shadow-sm rounded-xl border border-zinc-200">
        
        <CardHeader className="text-center space-y-2 pt-8">
          <CardTitle className="font-serif text-3xl font-bold text-zinc-900">
            Bienvenido de nuevo
          </CardTitle>
          <CardDescription className="text-sm text-zinc-500">
            Ingresa tus credenciales para continuar.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">Correo Electrónico</label>
              <Input 
                type="email" 
                required 
                placeholder="ejemplo@correo.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">Contraseña</label>
              <Input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-white"
              />
            </div>

            <div className="pt-2 space-y-4">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-white hover:bg-zinc-50 text-zinc-900 font-bold py-5 border border-zinc-200 shadow-sm transition-colors"
              >
                {loading ? 'Sincronizando Sesión...' : 'Iniciar Sesión'}
              </Button>

              <div className="text-center mt-4">
                <Link href="/registro" className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800">
                  ¿No tienes cuenta? Regístrate aquí
                </Link>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}