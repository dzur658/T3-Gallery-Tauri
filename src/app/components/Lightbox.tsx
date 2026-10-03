"use client";

import { useEffect, useState, useCallback } from "react";

import { getVLMResponse } from "../../lib/vlm";

interface LightboxProps {
  selected: string | null;
  onClose: () => void;
  onNavigate: (direction: 1 | -1) => void;
}

export default function Lightbox({ selected, onClose, onNavigate }: LightboxProps) {
  const [caption, setCaption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    setCaption(null);
    setLoading(false);
    onClose();
  }, [onClose]);


  const handleCaption = async ( ) => {
    setLoading(true);
    setCaption("");
    try {
      if (!(typeof selected === "string")) {
        throw new Error("VLM error: Invalid input types");
      }

      await getVLMResponse(
        "Describe this photo in one vivid sentence.",
        [selected],
        true,
        (text: string) => setCaption((prev) => prev + text),
      );
    } catch (error) {
      console.error("VLM error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selected) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === "Escape") {
        handleClose();
      } else if (event.key === "ArrowLeft") {
        onNavigate(-1);
      } else if (event.key === "ArrowRight") {
        onNavigate(1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, handleClose, onNavigate]);

  if (!selected) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
    >
      <button
        className="absolute top-4 right-4 text-white text-2xl cursor-pointer"
        onClick={handleClose}
      >
        &times;
      </button>
      <img src={selected} alt="" className="max-w-full max-h-full rounded-lg shadow-2xl" />

        {caption && 
        <div className="absolute bottom-15 left-2 right-2 bg-slate-800/85 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-lg mb-3 mx-4">
          <p className="text-sm text-slate-200 leading-snug">{caption}</p>
        </div>
        }

      <button
        onClick={handleCaption}
        disabled={loading}
        className="fixed bottom-4 mt-4 px-4 py-2 bg-purple-600 shadow-lg hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg cursor-pointer disabled:cursor-wait"
      >
        {loading ? "Creating…" : "Caption this"}
      </button>
    </div>
  );
}