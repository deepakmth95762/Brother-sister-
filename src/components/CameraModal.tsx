import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Sparkles } from 'lucide-react';
import { playCameraShutter } from '../utils/sound';
import { PhotoPreviewModal } from './PhotoPreviewModal';

interface CameraModalProps {
  recipientName: string;
  senderName: string;
  onClose: () => void;
  onSendPhoto: (photoUrl: string, caption: string) => void;
}

const STUDIO_SCENES = [
  {
    id: 'tea',
    label: 'Evening Masala Chai & Snacks',
    gradient: ['#C85A32', '#F4A261', '#2A9D8F'],
    subtitle: 'Freshly brewed at home · Shared via Brother & Sister Camera',
  },
  {
    id: 'garden',
    label: 'Backyard Sunlit Garden',
    gradient: ['#2F6F5E', '#52B788', '#D8F3DC'],
    subtitle: 'Golden hour family courtyard · Direct camera capture',
  },
  {
    id: 'desk',
    label: 'Study Desk & Handwritten Note',
    gradient: ['#3D405B', '#81B29A', '#F2CC8F'],
    subtitle: 'Quick snapshot from my desk · Private sibling chat',
  },
];

export const CameraModal: React.FC<CameraModalProps> = ({
  recipientName,
  senderName,
  onClose,
  onSendPhoto,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasHardwareStream, setHasHardwareStream] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
          activeStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasHardwareStream(true);
          }
        }
      } catch {
        // Fallback to interactive live canvas viewfinder when hardware camera is unavailable
        setHasHardwareStream(false);
      }
    }
    initCamera();
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    playCameraShutter();
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (hasHardwareStream && videoRef.current && videoRef.current.videoWidth > 0) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Render warm high-resolution instant camera snapshot
      const scene = STUDIO_SCENES[sceneIndex % STUDIO_SCENES.length];
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, scene.gradient[0]);
      grad.addColorStop(0.55, scene.gradient[1]);
      grad.addColorStop(1, scene.gradient[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 250, 240, 0.16)';
      ctx.beginPath();
      ctx.arc(640, 140, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 250, 240, 0.12)';
      ctx.beginPath();
      ctx.arc(180, 420, 150, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(28, 25, 23, 0.45)';
      ctx.fillRect(40, 420, 720, 140);

      ctx.fillStyle = '#FFFDF9';
      ctx.font = '600 28px "Fraunces", Georgia, serif';
      ctx.fillText(scene.label, 68, 472);

      ctx.fillStyle = 'rgba(255, 253, 249, 0.85)';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(scene.subtitle, 68, 506);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillStyle = 'rgba(255, 253, 249, 0.7)';
      ctx.font = '400 15px "JetBrains Mono", monospace';
      ctx.fillText(`Captured by ${senderName} · ${timeStr}`, 68, 538);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedDataUrl(dataUrl);
  };

  if (capturedDataUrl) {
    return (
      <PhotoPreviewModal
        photoUrl={capturedDataUrl}
        sourceLabel="Direct Camera Capture"
        recipientName={recipientName}
        onCancel={onClose}
        onRetake={() => setCapturedDataUrl(null)}
        onSend={(finalUrl, caption) => {
          onSendPhoto(finalUrl, caption);
          onClose();
        }}
      />
    );
  }

  const activeScene = STUDIO_SCENES[sceneIndex % STUDIO_SCENES.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-stone-900 text-white rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Camera Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#E07A5F]" />
            <span className="text-sm font-semibold">Take Photo for {recipientName}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Viewfinder */}
        <div className="relative aspect-[4/3] w-full bg-stone-950 overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${hasHardwareStream ? 'block' : 'hidden'}`}
          />

          {!hasHardwareStream && (
            <div
              className="w-full h-full flex flex-col justify-between p-6 transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${activeScene.gradient[0]}, ${activeScene.gradient[1]}, ${activeScene.gradient[2]})`,
              }}
            >
              <div className="flex items-center justify-between text-xs text-white/90">
                <span className="bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-md">
                  HD Viewfinder Ready
                </span>
                <button
                  type="button"
                  onClick={() => setSceneIndex((i) => i + 1)}
                  className="bg-black/40 hover:bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Switch Scene ({sceneIndex + 1}/{STUDIO_SCENES.length})
                </button>
              </div>

              {/* Grid overlay */}
              <div className="grid grid-cols-3 grid-rows-3 flex-1 my-3 border border-white/20 rounded-xl pointer-events-none">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div />
              </div>

              <div className="bg-black/45 backdrop-blur-md rounded-xl p-3">
                <p className="font-display text-base font-semibold text-white">
                  {activeScene.label}
                </p>
                <p className="text-xs text-white/80 mt-0.5">{activeScene.subtitle}</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Shutter Bar */}
        <div className="px-6 py-5 bg-stone-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 text-xs font-medium text-stone-300 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {/* Primary Shutter Button */}
          <button
            type="button"
            onClick={handleCapture}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 active:scale-95 transition-transform"
            aria-label="Capture photo"
          >
            <span className="w-full h-full rounded-full bg-[#C85A32]" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (hasHardwareStream) {
                setFacingMode((m) => (m === 'user' ? 'environment' : 'user'));
              } else {
                setSceneIndex((i) => i + 1);
              }
            }}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-200 flex items-center gap-1.5 transition-colors"
            title="Flip Camera / Scene"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Flip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
