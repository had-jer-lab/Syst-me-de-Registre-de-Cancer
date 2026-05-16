// hooks/useSpeechInput.js
import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechInput({ lang = 'fr-FR', onResult, continuous = true } = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  const recogRef      = useRef(null);
  const activeRef     = useRef(false);
  const onResultRef   = useRef(onResult);
  const accumulatedRef = useRef('');   // تجميع كل النص
  const silenceTimer  = useRef(null);  // مؤقت الصمت

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const recog           = new SR();
    recog.lang            = lang;
    recog.interimResults  = true;   // ✅ نتائج مؤقتة أثناء الكلام
    recog.maxAlternatives = 1;
    recog.continuous      = true;   // ✅ لا يتوقف بعد أول جملة

    recog.onstart = () => {
      activeRef.current = true;
      accumulatedRef.current = '';
      setListening(true);
    };

    recog.onresult = (e) => {
      // نجمع فقط النتائج النهائية
      let finalText = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript + ' ';
        }
      }
      if (finalText.trim()) {
        accumulatedRef.current = finalText.trim();
      }

      // مؤقت صمت — إذا توقف الكلام 1.5 ثانية نرسل النتيجة
      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        if (accumulatedRef.current && activeRef.current) {
          onResultRef.current?.(accumulatedRef.current);
          accumulatedRef.current = '';
        }
      }, 1500);
    };

    recog.onend = () => {
      // إذا كان لا يزال في وضع الاستماع أعد التشغيل (continuous workaround)
      if (activeRef.current) {
        try { recog.start(); } catch (_) {}
        return;
      }
      // إرسال ما تبقى
      clearTimeout(silenceTimer.current);
      if (accumulatedRef.current) {
        onResultRef.current?.(accumulatedRef.current);
        accumulatedRef.current = '';
      }
      setListening(false);
    };

    recog.onerror = (e) => {
      if (e.error === 'no-speech') return; // تجاهل خطأ الصمت
      activeRef.current = false;
      clearTimeout(silenceTimer.current);
      setListening(false);
    };

    recogRef.current = recog;
    return () => {
      recog.onstart = recog.onresult = recog.onend = recog.onerror = null;
      clearTimeout(silenceTimer.current);
      try { recog.abort(); } catch (_) {}
      activeRef.current = false;
    };
  }, [lang]);

  const start = useCallback(() => {
    if (!recogRef.current || activeRef.current) return;
    accumulatedRef.current = '';
    try { recogRef.current.start(); } catch (_) {}
  }, []);

  const stop = useCallback(() => {
    if (!recogRef.current || !activeRef.current) return;
    activeRef.current = false;
    clearTimeout(silenceTimer.current);
    // إرسال ما تجمع قبل الإيقاف
    if (accumulatedRef.current) {
      onResultRef.current?.(accumulatedRef.current);
      accumulatedRef.current = '';
    }
    try { recogRef.current.stop(); } catch (_) {}
  }, []);

  const toggle = useCallback(() => {
    activeRef.current ? stop() : start();
  }, [start, stop]);

  return { listening, supported, start, stop, toggle };
}