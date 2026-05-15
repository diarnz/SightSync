import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Volume2, AlertCircle, RefreshCw } from 'lucide-react';

const SceneAssistantPage: React.FC = () => {
  const [isDescribing, setIsDescribing] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const captureAndDescribe = useCallback(async () => {
    if (!webcamRef.current) return;
    
    setIsDescribing(true);
    setError(null);
    setDescription(null);
    setAudioBase64(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error('Failed to capture image');

      // Convert base64 data URL to a Blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');
      
      // Call the FastAPI backend (proxied via Vite /api)
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setDescription(data.description);
      
      if (data.audio_base64) {
        setAudioBase64(data.audio_base64);
        playAudio(data.audio_base64);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsDescribing(false);
    }
  }, [webcamRef]);

  const playAudio = (base64Data: string) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
      audio.play();
    } catch (e) {
      console.error("Failed to play audio:", e);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col p-4 sm:p-8 max-w-4xl mx-auto z-10">
      
      {/* Header */}
      <header className="mb-8 text-center slide-up">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 gradient-text">SightSync</h1>
        <p className="text-color-text-muted text-lg sm:text-xl font-medium">
          Scene Description Assistant
        </p>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 slide-up" style={{ animationDelay: '0.1s' }}>
        
        {/* Camera View */}
        <section className="relative w-full rounded-2xl overflow-hidden card-glass aspect-video sm:aspect-square md:aspect-video flex items-center justify-center bg-black/50 border-2 border-transparent transition-all duration-300 hover:border-blue-500/30">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Overlay elements */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
          
          {isDescribing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4" />
              <p className="text-xl font-semibold text-white animate-pulse">Analyzing Scene...</p>
            </div>
          )}
        </section>

        {/* Action Controls */}
        <section className="grid grid-cols-1 gap-4 slide-up" style={{ animationDelay: '0.2s' }}>
          <button 
            onClick={captureAndDescribe}
            disabled={isDescribing}
            className="btn-primary w-full py-4 sm:py-6 text-xl shadow-blue-500/20"
            aria-label="Capture image and describe scene"
          >
            <Camera className="w-6 h-6 mr-2" />
            {isDescribing ? 'Processing...' : 'Describe Scene'}
          </button>
        </section>

        {/* Results Area */}
        {error && (
          <div className="card-glass p-6 border-red-500/30 bg-red-500/10 fade-in flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-400 mb-1">Error</h3>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {description && (
          <div className="card-glass p-6 sm:p-8 fade-in relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-400" />
            
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Volume2 className="w-6 h-6 text-blue-400" />
                Scene Description
              </h2>
              <button 
                onClick={() => audioBase64 && playAudio(audioBase64)}
                disabled={!audioBase64}
                className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Read description aloud again"
                title="Read aloud"
              >
                <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </button>
            </div>
            
            <p className="text-lg sm:text-xl leading-relaxed text-gray-200">
              {description}
            </p>
          </div>
        )}
      </main>

    </div>
  );
};

export default SceneAssistantPage;
