import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, X, ImageIcon } from 'lucide-react';
import { api } from '../../api';
import { compressImage } from '../../utils/image';

interface Props {
  workerId: number;
  editable?: boolean;
}

export const WorkerGallery: React.FC<Props> = ({ workerId, editable = false }) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!workerId) { setLoading(false); return; }
    api.getGallery(workerId)
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [workerId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const dataUrl = await compressImage(file, 1000, 0.7);
      const img = await api.addGalleryImage(workerId, dataUrl, '');
      setImages(prev => [img, ...prev]);
    } catch (err: any) {
      setError(err.message || 'שגיאה בהעלאה');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (id: number) => {
    setImages(prev => prev.filter(i => i.Id !== id));
    await api.deleteGalleryImage(workerId, id).catch(() => {});
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // צפייה בלבד (מסעדה) ואין תמונות — אל תציג כלום
  if (!editable && images.length === 0) return null;

  return (
    <div>
      {error && <div className="bg-red-50 text-red-600 rounded-xl p-2.5 text-sm text-center mb-2">{error}</div>}

      <div className="grid grid-cols-3 gap-2">
        {/* כפתור העלאה */}
        {editable && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-amber-300 flex flex-col items-center justify-center gap-1 text-amber-500 bg-amber-50/50 active:bg-amber-50"
          >
            {uploading
              ? <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              : <><Plus size={20} /><span className="text-[10px] font-semibold">הוסף</span></>}
          </button>
        )}

        {images.map(img => (
          <div key={img.Id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
            <img src={img.ImageData} alt={img.Caption || ''} className="w-full h-full object-cover"
              onClick={() => setLightbox(img.ImageData)} />
            {editable && (
              <button onClick={() => handleDelete(img.Id)}
                className="absolute top-1 left-1 w-6 h-6 rounded-lg bg-black/60 flex items-center justify-center text-white">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {editable && images.length === 0 && !uploading && (
        <div className="flex items-center gap-2 text-gray-400 text-xs mt-2">
          <ImageIcon size={13} /> הצג למסעדות תמונות של מנות ועבודות שלך
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white"
            onClick={() => setLightbox(null)}>
            <X size={18} />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
};
