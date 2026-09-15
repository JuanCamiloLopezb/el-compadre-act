import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-300 pt-12 pb-8 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        
        {/* Columna 1: Branding y Propósito */}
        <div className="space-y-3">
          <h3 className="text-2xl font-black text-white tracking-tight">Los Compadres</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Tu licorería express de confianza. Entregas frías y garantizadas en minutos directamente a tu puerta.
          </p>
          <p className="text-[11px] text-zinc-500">
            El exceso de alcohol es perjudicial para la salud. Prohibida la venta a menores de edad.
          </p>
        </div>

        {/* Columna 2: Datos de Contacto del Negocio */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contacto</h4>
          <ul className="space-y-2 text-xs text-zinc-400">
            <li className="flex items-center gap-2">
              📍 <span className="font-medium">Calle 93 # 13-45, Bogotá, Colombia</span> 
            </li>
            <li className="flex items-center gap-2">
              📞 <span className="font-medium">+57 (300) 123-4567</span>
            </li>
            <li className="flex items-center gap-2">
              ✉️ <span className="font-medium">pedidos@loscompadres.com</span>
            </li>
            <li className="flex items-center gap-2">
              ⏰ <span className="font-medium">Jue a Dom: 4:00 PM - 3:00 AM</span>
            </li>
          </ul>
        </div>

        {/* Columna 3: Información Legal */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Legales</h4>
          <ul className="space-y-2 text-xs text-zinc-400">
            <li>
              <Link href="/terminos" className="hover:text-white transition-colors">
                Términos y Condiciones
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-white transition-colors">
                Política de Tratamiento de Datos (Habeas Data)
              </Link>
            </li>
            <li>
              <Link href="/envios" className="hover:text-white transition-colors">
                Políticas de Domicilio y Devoluciones
              </Link>
            </li>
            <li>
              <Link href="/responsable" className="hover:text-white transition-colors">
                Consumo Responsable
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 4: Pagos Seguros con ePayco */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Pago Seguro</h4>
          <p className="text-xs text-zinc-400">
            Procesamos tus transacciones de forma encriptada y protegida a través de:
          </p>
          
          {/* Badge ePayco y Métodos */}
          <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700/50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest">ePayco</span>
              <span className="text-[10px] bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded font-mono">SSL 256-bit</span>
            </div>
            
            {/* Logos texto/badges de métodos soportados */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-zinc-300 pt-1">
              <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">PSE</span>
              <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">Nequi</span>
              <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">Daviplata</span>
              <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">Tarjetas</span>
            </div>
          </div>
        </div>

      </div>

      {/* Franja Inferior de Derechos Reservados */}
      <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 gap-2">
        <p>© {new Date().getFullYear()} Los Compadres. Todos los derechos reservados.</p>
        <p>Desarrollado por: K.A.J.A</p>
      </div>
    </footer>
  );
}