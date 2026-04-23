import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';

interface Props {
  auditId: string;
  onClose: () => void;
  onSubmit: (base64Video: string) => void;
}

export const VideoSelfie: React.FC<Props> = ({ auditId, onClose, onSubmit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access is required for the audit.");
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startRecording = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;

    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setRecordedVideo(base64data.split(',')[1]); // remove data prefix
      };
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);

    // 5 second timer
    let time = 5;
    setTimeLeft(time);
    const interval = setInterval(() => {
      time -= 1;
      setTimeLeft(time);
      if (time === 0) {
        clearInterval(interval);
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      }
    }, 1000);
  }, []);

  const handleSubmit = async () => {
    if (!recordedVideo) return;
    setIsSubmitting(true);
    // Simulate upload delay
    setTimeout(() => {
      onSubmit(recordedVideo);
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Video Selfie Audit</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Please record a 5-second video showing your face and surroundings to prove your green action.
        </p>

        <div className="relative aspect-[3/4] bg-black rounded-xl overflow-hidden mb-6">
          {!recordedVideo ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover"
              />
              {isRecording && (
                <div className="absolute top-4 right-4 bg-red-500 text-white font-mono font-bold px-3 py-1 rounded-full animate-pulse">
                  00:0{timeLeft}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
              <Check className="w-16 h-16 text-emerald-500 mb-4" />
              <p className="text-white font-medium">Video Recorded Successfully</p>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          {!recordedVideo ? (
            <button
              onClick={startRecording}
              disabled={isRecording}
              className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
                isRecording ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>{isRecording ? 'Recording...' : 'Start Recording'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setRecordedVideo(null)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
              >
                Retake
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Audit'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
