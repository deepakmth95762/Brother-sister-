import React, { useState } from 'react';
import { X, Send, Sparkles, RotateCcw, Image as ImageIcon, ShieldCheck } from 'lucide-react';

interface PhotoPreviewModalProps {
  photoUrl: string;
  sourceLabel: string;
  recipientName: string;
  onCancel: () => void;
  onRetake?: () => void;
  onSend: (finalPhotoUrl: string, caption: string) => void;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  photoUrl,
  sourceLabel,
  recipientName,
  onCancel,
  onRetake,
  onSend,
}) => {
  const [caption, setCaption] = useState('');
  const [warmFilter, setWarmFilter] = useState<'natural' | 'warm' | 'vivid'>('natural');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(photoUrl, caption.trim());
  };

  const filterClass =
    warmFilter === 'warm'
      ? 'sepia-[.18] saturate-[1.15] contrast-[1.03]'
      : warmFilter === 'vivid'
      ? 'saturate-[1.25] contrast-[1.06]'
      : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[#FAF8F5] rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 bg-white">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-[#C85A32]" />
            <span className="text-sm font-semibold text-stone-900">
              Preview Photo Before Sending
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Container */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-stone-900 aspect-[4/3] flex items-center justify-center border border-stone-200">
            <img
              src={photoUrl}
              alt="Selected preview before sending"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all duration-200 ${filterClass}`}
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-xl">
              <span>Source: {sourceLabel}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Private to {recipientName}
              </span>
            </div>
          </div>

          {/* Tone adjustment segmented control */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
              Photo Tone
            </span>
            <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl">
              {(['natural', 'warm', 'vivid'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setWarmFilter(tone)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${
                    warmFilter === tone
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Caption input */}
          <form id="photo-preview-form" onSubmit={handleSubmit} className="space-y-2">
            <label className="block text-xs font-medium text-stone-700">
              Add a note with your photo (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={`Write a message for ${recipientName}...`}
              className="w-full px-4 py-3 text-sm bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#C85A32]"
              autoFocus
            />
          </form>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-white border-t border-stone-200/80 flex items-center justify-between gap-3">
          {onRetake ? (
            <button
              type="button"
              onClick={onRetake}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Photo
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            form="photo-preview-form"
            className="min-h-[44px] flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-[#C85A32] hover:bg-[#B24C27] rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            Send Photo to {recipientName}
          </button>
        </div>
      </div>
    </div>
  );
};
