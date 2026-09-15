'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
}

export function ImageUploader({ onImageUploaded, currentImageUrl }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Subir archivo al bucket 'productos'
      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      setPreview(publicUrl);
      onImageUploaded(publicUrl);
    } catch (error: any) {
      alert('Error subiendo imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-700">Imagen del Producto</label>
      
      {preview && (
        <div className="relative w-full h-36 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 flex items-center justify-center mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa" className="h-full object-contain p-2" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          disabled={uploading} 
          className="text-xs"
        />
        {uploading && <span className="text-xs text-zinc-500 font-bold animate-pulse">Subiendo...</span>}
      </div>
    </div>
  );
}