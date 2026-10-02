"use client";

import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { homeDir, join } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";

export default function Page() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("__TAURI_INTERNALS__" in window)) return;

    (async () => {
      try {
        const homedir = await homeDir();
        
        // picture dir
        const dir = `${homedir}/Pictures`;

        // console.log("Home directory:", dir);
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

  console.log("Loaded images:", images);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pictures</h1>
      {images.length === 0 ? (
        <p>No images found (or not running inside Tauri).</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {images.map((src) => (
            <img key={src} src={src} alt="" className="rounded shadow" />
          ))}
        </div>
      )}
    </main>
  );
}