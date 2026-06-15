import { useEffect } from 'react';
import { useAppState } from '../context/Context';

export const useSpeechListener = (isActive: boolean) => {
  const { triggerSOS } = useAppState();

  useEffect(() => {
    if (!isActive) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is unsupported in this browser environment.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ')
        .toLowerCase();

      if (transcript.includes('mary') || transcript.includes('help me')) {
        triggerSOS();
      }
    };

    recognition.onerror = (e: any) => console.error('Speech runtime alert:', e.error);
    recognition.onend = () => { if (isActive) recognition.start(); };

    recognition.start();
    return () => recognition.stop();
  }, [isActive, triggerSOS]);
};