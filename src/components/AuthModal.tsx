'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export function AuthModal({ isOpen, open, onClose }: AuthModalProps) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mostrar = isOpen ?? open ?? false;
  if (!mostrar) return null;

  const cerrarModal = () => {
    if (onClose) onClose();
  };

  const redireccionarPorRol = async (userId: string, userEmail: string) => {
    try {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', userId)
        .maybeSingle();

      const rol = perfil?.rol;

      if (userEmail === 'juancamilo.lopez.0510@gmail.com' || rol === 'admin') {
        window.location.href = '/admin';
      } else if (rol === 'cajero') {
        window.location.href = '/cajero';
      } else if (rol === 'repartidor') {
        window.location.href = '/repartidor';
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      window.location.reload();
    }
  };

  // --- INICIAR SESIÓN CON GOOGLE ---
  const handleLoginGoogle = async () => {
    setCargandoGoogle(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error Google OAuth:', err);
      setErrorMsg(err?.message || 'Error al conectar con Google');
      setCargandoGoogle(false);
    }
  };

  // --- INICIO TRADICIONAL CON CORREO / CONTRASEÑA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg('');

    const correoLimpio = email.trim();

    try {
      if (esRegistro) {
        const { error } = await supabase.auth.signUp({
          email: correoLimpio,
          password,
          options: {
            data: { nombre: nombre.trim() },
          },
        });

        if (error) throw error;

        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
        setEsRegistro(false);
        setPassword('');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: correoLimpio,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          await redireccionarPorRol(data.user.id, data.user.email || '');
        }
      }
    } catch (err: any) {
      const mensaje = err?.message || '';
      if (mensaje.includes('Invalid login credentials')) {
        setErrorMsg('Correo o contraseña incorrectos.');
      } else {
        setErrorMsg(mensaje || 'Ocurrió un error al procesar la solicitud.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 border-t-4 border-t-[#073b78]">
        <button
          type="button"
          onClick={cerrarModal}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-serif font-black text-[#073b78] mb-1">
          {esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          {esRegistro
            ? 'Regístrate para comprar y acceder a tus pedidos.'
            : 'Ingresa a tu cuenta para continuar.'}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {errorMsg}
          </div>
        )}

        {/* BOTÓN GOOGLE */}
        <button
          type="button"
          onClick={handleLoginGoogle}
          disabled={cargandoGoogle || cargando}
          className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold py-2.5 px-4 rounded-lg shadow-sm text-xs transition-colors cursor-pointer disabled:opacity-60"
        >
          {cargandoGoogle ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continuar con Google</span>
        </button>

        {/* SEPARADOR "O" */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-zinc-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold uppercase text-zinc-400 tracking-wider absolute">
            o
          </span>
        </div>

        {/* FORMULARIO CORREO / CONTRASEÑA */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {esRegistro && (
            <div className="space-y-1">
              <label className="font-bold text-zinc-700">Nombre Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <Input
                  type="text"
                  required
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-zinc-700">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <Input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-zinc-700">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={cargando || cargandoGoogle}
            className="w-full bg-[#073b78] hover:bg-[#052d5e] text-white font-bold h-10 text-xs flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
              </>
            ) : esRegistro ? (
              'Crear mi Cuenta'
            ) : (
              'Ingresar'
            )}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t text-center text-xs text-zinc-500">
          {esRegistro ? (
            <>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => { setEsRegistro(false); setErrorMsg(''); }}
                className="text-[#073b78] font-bold hover:underline cursor-pointer"
              >
                Inicia sesión aquí
              </button>
            </>
          ) : (
            <>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => { setEsRegistro(true); setErrorMsg(''); }}
                className="text-[#073b78] font-bold hover:underline cursor-pointer"
              >
                Regístrate gratis
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;