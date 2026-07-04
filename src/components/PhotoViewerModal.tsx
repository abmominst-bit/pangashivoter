import React from 'react';
import { X, Download, User } from 'lucide-react';

interface PhotoViewerModalProps {
  photoUrl: string | null | undefined;
  voterName: string;
  voterNameBn?: string;
  voterNo?: string;
  gender?: 'Male' | 'Female';
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoViewerModal({
  photoUrl,
  voterName,
  voterNameBn,
  voterNo,
  gender,
  isOpen,
  onClose
}: PhotoViewerModalProps) {
  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!photoUrl) return;
    
    // Normalize filename
    const safeName = voterName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${safeName}_voter_photo.jpg`;

    try {
      // For base64 data URIs or local assets
      if (photoUrl.startsWith('data:') || photoUrl.startsWith('blob:') || photoUrl.startsWith('/') || photoUrl.startsWith('http')) {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Fallback required');
      }
    } catch (e) {
      // Fallback approach
      const link = document.createElement('a');
      link.href = photoUrl;
      link.target = '_blank';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition duration-300">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Main Modal Card */}
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative z-10 flex flex-col items-center text-center text-white transform scale-100 transition duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition hover:scale-105 cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header Title */}
        <div className="mb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
            Voter Photo Preview
          </span>
          <h3 className="text-sm font-bold text-slate-200 mt-0.5">
            ভোটার ছবি প্রদর্শন
          </h3>
        </div>

        {/* Medium Size Photo Frame */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl border-4 border-white/20 p-1.5 bg-white/5 shadow-inner overflow-hidden mb-5 flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={voterName}
              className="w-full h-full object-cover rounded-xl shadow-md transition duration-200 hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300">
              <User size={64} className="text-slate-400 opacity-60 mb-2" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Photo Available</span>
            </div>
          )}
        </div>

        {/* Voter Short Info */}
        <div className="mb-6 space-y-1 w-full px-2">
          <div className="text-lg font-black tracking-wide truncate">
            {voterNameBn || voterName}
          </div>
          {voterNameBn && (
            <div className="text-xs text-slate-300 font-medium truncate">
              {voterName}
            </div>
          )}
          {voterNo && (
            <div className="text-[11px] font-mono font-extrabold text-cyan-300/90 mt-1 bg-white/5 py-1 px-3 rounded-full inline-block">
              Voter No: {voterNo}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/25 rounded-xl font-bold text-xs transition duration-150 cursor-pointer text-center"
          >
            বন্ধ করুন (Close)
          </button>
          
          {photoUrl && (
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white rounded-xl font-black text-xs transition duration-150 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>ডাউনলোড (Save)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
