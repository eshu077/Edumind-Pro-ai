"use client";

import { useEffect, useRef, useState } from "react";

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start() {
    if (!recognitionRef.current || isListening) return;
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  }

  function stop() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  return { supported, isListening, start, stop };
}
