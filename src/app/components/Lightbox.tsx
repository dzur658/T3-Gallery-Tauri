"use client";

import { useEffect } from "react";

interface LightboxProps {
  selected: string | null;
  onClose: () => void;
  onNavigate: (direction: 1 | -1) => void;
}

export default function Lightbox({ selected, onClose, onNavigate }: LightboxProps) {
  useEffect(() => {
    if (!selected) return; // don't listen at all when closed

    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        onNavigate(-1);
      } else if (event.key === "ArrowRight") {
        onNavigate(1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey); // exact mirror of add
  }, [selected, onClose, onNavigate]);

  if (!selected) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-2xl cursor-pointer"
        onClick={onClose}
      >
        &times;
      </button>
      <img src={selected} alt="" className="max-w-full max-h-full rounded-lg shadow-2xl" />
    </div>
  );
}