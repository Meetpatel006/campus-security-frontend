'use client'

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';

export default function ScreenShare() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastDetection, setLastDetection] = useState<any>(null);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const sendFrameForDetection = async () => {
    try {
      const frameData = await captureFrame();
      if (!frameData) return;

      // Use a default camera ID for screen sharing
      const response = await fetch('/api/detect/frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          camera_id: 'screen-share-default',
          frame_data: frameData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastDetection(result);
        console.log('Detection result:', result);
      } else {
        console.error('Detection failed:', response.status);
      }
    } catch (error) {
      console.error('Error sending frame for detection:', error);
    }
  };

  const startDetection = () => {
    if (detectionInterval) return;
    
    setIsDetecting(true);
    // Send a frame every 2 seconds for detection
    const interval = setInterval(sendFrameForDetection, 2000);
    setDetectionInterval(interval);
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
    setIsDetecting(false);
    setLastDetection(null);
  };

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
    stopDetection(); // Stop detection when stopping screen share
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
      stopDetection(); // Clean up detection interval
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (isFullscreen) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, [stream, isFullscreen, detectionInterval]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
        muted
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      
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
        <>
          {/* Detection status overlay */}
          {lastDetection && (
            <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${lastDetection.is_anomaly ? 'bg-red-500' : 'bg-green-500'}`} />
                <span>{lastDetection.detected_class}</span>
                <span className="text-gray-300">({(lastDetection.confidence * 100).toFixed(1)}%)</span>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              onClick={isDetecting ? stopDetection : startDetection}
              variant="outline"
              size="icon"
              className={`${
                isDetecting 
                  ? 'bg-green-600/80 hover:bg-green-700/90' 
                  : 'bg-gray-900/70 hover:bg-gray-800/90'
              } text-white`}
            >
              {isDetecting ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
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
        </>
      )}
    </div>
  );
}
