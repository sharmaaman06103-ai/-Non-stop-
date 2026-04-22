import { useState, useEffect } from 'react';
import localforage from 'localforage';
import { Lock, Unlock, Upload, X, ArrowLeft, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function Vault({ onClose }: { onClose: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    localforage.getItem('vault_pin').then((pin) => {
      setStoredPin(pin as string | null);
      setLoading(false);
    });
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storedPin) {
      if (pinInput.length < 4) {
        alert('PIN must be at least 4 digits');
        return;
      }
      localforage.setItem('vault_pin', pinInput);
      setStoredPin(pinInput);
      setIsAuthenticated(true);
      loadPhotos();
    } else if (pinInput === storedPin) {
      setIsAuthenticated(true);
      loadPhotos();
    } else {
      alert('Access Denied. Incorrect PIN.');
      setPinInput('');
    }
  };

  const loadPhotos = async () => {
    const storedPhotos = (await localforage.getItem('vault_photos')) || [];
    setPhotos(storedPhotos as string[]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotosArray: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        newPhotosArray.push(base64);
        processed++;
        
        if (processed === files.length) {
          setPhotos((prev) => {
            const updated = [...newPhotosArray, ...prev];
            localforage.setItem('vault_photos', updated);
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const deletePhoto = (indexToDelete: number) => {
    if (!confirm('Permanently delete this item?')) return;
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== indexToDelete);
      localforage.setItem('vault_photos', updated);
      return updated;
    });
    setPreviewImage(null);
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] text-[#F5F5F5] overflow-y-auto w-full h-full">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 h-full flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-red-900/30 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-[0.2em] uppercase text-red-500 font-mono flex items-center gap-2">
                <Lock className="w-5 h-5" /> Secured Archive
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Encrypted Local Storage</span>
            </div>
          </div>
        </header>

        {/* Lock Screen */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center">
            <form onSubmit={handlePinSubmit} className="w-full max-w-sm p-8 bg-[#151515] rounded-3xl border border-red-900/50 shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/50">
                {storedPin ? <Lock className="w-8 h-8" /> : <Unlock className="w-8 h-8" />}
              </div>
              <h2 className="text-xl font-serif italic mb-2 text-center">
                {storedPin ? 'Enter required PIN' : 'Create a New PIN'}
              </h2>
              <p className="text-xs text-center text-white/50 mb-8 max-w-[250px]">
                {storedPin 
                  ? 'Access the hidden encrypted gallery.' 
                  : 'Set a numeric passcode to secure your private files locally.'}
              </p>
              
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-3xl tracking-[1em] py-4 bg-black/50 border border-white/10 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all mb-6 font-mono"
                placeholder="****"
                maxLength={8}
                autoFocus
              />
              
              <button 
                type="submit"
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl uppercase tracking-widest text-xs font-bold transition-colors"
                disabled={!pinInput}
              >
                {storedPin ? 'Decrypt & View' : 'Lock & Save'}
              </button>
            </form>
          </div>
        ) : (
          /* Vault Content */
          <div className="flex-1 flex flex-col animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h1 className="text-2xl font-serif italic text-white/90">Private Repository</h1>
              
              <label className="cursor-pointer bg-[#E1C27A]/10 hover:bg-[#E1C27A]/20 border border-[#E1C27A]/50 text-[#E1C27A] px-4 py-2 rounded-full text-xs uppercase tracking-widest font-mono flex items-center gap-2 transition-colors">
                <Upload className="w-4 h-4" /> Import Files
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/gif, image/webp" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {photos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-20">
                <ImageIcon className="w-16 h-16 mb-6" />
                <p className="text-sm font-serif italic mb-2">The vault is completely empty.</p>
                <p className="text-[10px] uppercase tracking-widest font-mono">Use the import button to hide active files.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {photos.map((photo, i) => (
                  <div 
                    key={i} 
                    className="aspect-square relative group bg-[#111] rounded-xl overflow-hidden border border-white/10 hover:border-white/30 cursor-zoom-in"
                    onClick={() => setPreviewImage(photo)}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePhoto(i); }}
                      className="absolute top-2 right-2 p-2.5 bg-red-600/90 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-xl"
                      title="Destroy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Full Screen Image Preview Overlay */}
        {previewImage && (
          <div 
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center backdrop-blur-md cursor-zoom-out p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button 
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 text-white"
              onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
