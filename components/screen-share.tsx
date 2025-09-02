'use client'

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';

export default function ScreenShare() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
        audio: false,
      });

      setStream(screenStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
        videoRef.current.play().catch(console.error);
      }

      // Handle when user stops sharing via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setIsSharing(true);
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsSharing(false);
    if (isFullscreen) {
      document.exitFullscreen().catch(console.error);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(console.error);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (isFullscreen) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, [stream, isFullscreen]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
        muted
      />
      
      {!isSharing ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <Button
            onClick={startScreenShare}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Video className="w-4 h-4" />
            Start Screen Sharing
          </Button>
        </div>
      ) : (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="icon"
            className="bg-gray-900/70 hover:bg-gray-800/90 text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={stopScreenShare}
            variant="outline"
            size="icon"
            className="bg-red-600/80 hover:bg-red-700/90 text-white"
          >
            <VideoOff className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
