// hooks/useWhisperInput.js
// يسجل الصوت بـ MediaRecorder ويرسله لـ Django → Groq Whisper
import { useState, useRef, useCallback } from 'react';

export function useWhisperInput({ lang = 'ar', onResult, onError } = {}) {
  const [listening,  setListening]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [supported,  setSupported]  = useState(!!navigator.mediaDevices?.getUserMedia);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);

  const start = useCallback(async () => {
    if (listening || loading) return;
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // نختار الصيغة المدعومة
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // إيقاف الميكروفون
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        if (chunksRef.current.length === 0) return;

        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        setLoading(true);
        try {
          const token = localStorage.getItem('access_token');
          const formData = new FormData();
          const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
          formData.append('audio', blob, `voice.${ext}`);
          formData.append('lang', lang);

          const res = await fetch('http://localhost:8000/api/patients/whisper-parse/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);

          onResult?.(data);   // data = { fields, transcript }
        } catch (e) {
          onError?.(e.message || 'خطأ في الاتصال');
        } finally {
          setLoading(false);
        }
      };

      recorder.start(250); // chunk كل 250ms
      setListening(true);

    } catch (e) {
      onError?.(e.message?.includes('Permission')
        ? 'يرجى السماح بالوصول للميكروفون'
        : e.message || 'خطأ في الميكروفون');
    }
  }, [listening, loading, lang, onResult, onError]);

  const stop = useCallback(() => {
    if (!listening) return;
    setListening(false);
    try { mediaRecorderRef.current?.stop(); } catch (_) {}
  }, [listening]);

  const toggle = useCallback(() => {
    listening ? stop() : start();
  }, [listening, start, stop]);

  return { listening, loading, supported, start, stop, toggle };
}