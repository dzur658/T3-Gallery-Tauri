"use client";

import { useEffect, useState } from "react";

interface LightboxProps {
  images: string[];
  selected: string | null;
  onClose: () => void;
}

export default function Lightbox({ images, selected, onClose }: LightboxProps) {
  const [lastKey, setLastkey] = useState("");
  // let [selected, setSelected] = useState<string | null>(null);

  // handle key down
  const handleKeyDown = (event: KeyboardEvent) => {
    setLastkey(event.key);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    console.log("Last key pressed:", lastKey);
    if (lastKey === "Escape") {
      setLastkey("");
      onClose();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, images]);

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