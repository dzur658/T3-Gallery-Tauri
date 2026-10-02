"use client";

import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { pictureDir, join } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";
import Lightbox from "./components/Lightbox";

export default function Page() {
  const [images, setImages] = useState<string[]>([]);

  // picture clicker tracker
  const [selected, setSelected] = useState<string | null>(null);

  const handleClose = () => setSelected(null);

  const handleNavigate = (direction: 1 | -1) => {
    if (!selected) return;
    const currentIndex = images.indexOf(selected);
    const nextImage = images[currentIndex + direction];
    if (nextImage) {
      setSelected(nextImage);
    };

  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("__TAURI_INTERNALS__" in window)) return;

    (async () => {
      try {
        const dir = await pictureDir();

        console.log("Pictures", dir);
        const entries = await readDir(dir);
        const paths = entries
          .filter(
            (e) => e.isFile && /\.(jpg|png|gif|webp|avif|bmp)$/i.test(e.name)
          )
          .map(async (e) => convertFileSrc(await join(dir, e.name)));
        await setImages(await Promise.all(paths));
      } catch (err) {
        console.error("Failed to load pictures:", err);
      }
    })();
  }, []);

  return (
    <main className="p-8 bg-slate-900 min-h-screen text-slate-100">
      <h1 className="text-3xl font-bold tracking-tight mb-6 border-b border-slate-700 pb-4">Pictures</h1>
      {images.length === 0 ? (
        <p>No images found (or not running inside Tauri).</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((src) => (
            <div key={src} className="overflow-hidden rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition">
              <img  
              src={src} 
              alt=""
              onClick={() => setSelected(src)}
              className="w-full h-48 object-cover rounded-lg" />
            </div>
          ))}
        </div>
      )}
      <Lightbox selected={selected} onClose={handleClose} onNavigate={handleNavigate} />
    </main>
  );
}