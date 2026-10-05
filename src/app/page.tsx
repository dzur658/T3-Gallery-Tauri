"use client";

import { useEffect, useState } from "react";

import { convertFileSrc } from "@tauri-apps/api/core";
import { pictureDir, join } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";

import Lightbox from "./components/Lightbox";

import { getVLMResponse, getVLM } from "../lib/vlm";

export default function Page() {
  const [images, setImages] = useState<string[]>([]);

  // picture clicker tracker
  const [selected, setSelected] = useState<string | null>(null);

  // path selection for image story
  const [selectedStoryURLs, setSelectedStoryURLs] = useState<string[]>([]);

  const [story, setStory] = useState<string | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  const [storyPanelOpen, setStoryPanelOpen] = useState(false);

  // track model state
  const [modelOverallPercent, setModelOverallPercent] = useState<number | undefined>(undefined);
  const [modelReady, setModelReady] = useState(false);

  const toggleSelect = (url: string) =>
    setSelectedStoryURLs((prev) =>
    prev.includes(url)
      ? prev.filter((u) => u !== url)
      : prev.length < 5 ? [...prev, url] : prev
    );

    const handleStory = async ( ) => {
      setStoryLoading(true);
      setStoryPanelOpen(true);
      setStory("");
      try {
      await getVLMResponse(
        `You write REALLY FUNNY STORIES but you've only ever seen these ${selectedStoryURLs.length} images.
        Write a story that connects the dots however absurd it may be. You are not allowed to describe the photos individually,
        you must weave them all together into a semi-coherent story. Emoji use is permitted for irony. Your story can be no longer than
        15 sentences long.`,
        selectedStoryURLs,
        false,
        (text: string) => setStory((prev) => (prev ?? "") + text),
      );
      } catch (error) {
        console.error("VLM error:", error);
      } finally {
        setStoryLoading(false);
      }
    }

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

    const loadPictures = (async () => {
      try {
        const dir = await pictureDir();

        const entries = await readDir(dir);
        const paths = entries
          .filter(
            (e) => e.isFile && /\.(jpg|png|gif|webp|avif|bmp)$/i.test(e.name)
          )
          .map(async (e) => convertFileSrc(await join(dir, e.name)));
        setImages(await Promise.all(paths));
      } catch (err) {
        console.error("Failed to load pictures:", err);
      }
    })();

    void loadPictures;
  }, []);

useEffect(() => {
  void getVLM((pct) => setModelOverallPercent(pct)).then(() => {
    setModelReady(true); // ← fires when the model is ACTUALLY usable, not when bytes land
  });
}, []);


  return (
    <main className="p-8 bg-slate-900 min-h-screen text-slate-100">
      <h1 className="text-3xl font-bold tracking-tight mb-6 pb-4">VLM Gallery</h1>
      <div className="border-b border-slate-700 mb-8">
        <ul className="mb-8 space-y-3 text-slate-300 leading-relaxed max-w-prose">
        <li className="flex gap-3">
          <span aria-hidden>⚡</span>
          <span>Runs inference <strong className="text-slate-100 font-semibold">locally</strong> via transformers.js so no data leaves your machine</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden>🖼️</span>
          <span><strong className="text-slate-100 font-semibold">Gallery:</strong> browse your images in a grid; use arrow keys to navigate in fullscreen</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden>💬</span>
          <span><strong className="text-slate-100 font-semibold">Captions:</strong> click an image, then hit &quot;Caption this&quot;</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden>📖</span>
          <span><strong className="text-slate-100 font-semibold">Stories:</strong> select multiple images and click &quot;Generate Story&quot; to weave them together</span>
        </li>
      </ul>
    </div>
    {selectedStoryURLs.length > 0 && (
      <div className="w-12 h-12 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center mb-4">
        <strong className="text-slate-100 text-sm">
          <span className="text-slate-400">{selectedStoryURLs.length} / 5</span>
        </strong>
      </div>
    )}
    {!modelReady && modelOverallPercent != null && (
      <div className="mb-6 max-w-md">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
          <span>{modelReady ? "" : "Loading model (Downloads from Hugging Face on first run)…"}</span>
          <span>{modelOverallPercent != null ? `${modelOverallPercent}%` : ""}</span>
        </div>

        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          {modelOverallPercent != null ? (
            // determinate: library-reported aggregate percent
            <div
              className="h-full bg-sky-500 transition-all duration-200"
              style={{ width: `${modelOverallPercent}%` }}
            />
          ) : (
            // indeterminate: server didn't report sizes — pulse instead of lie
            <div className="h-full w-1/3 bg-sky-500/60 animate-pulse" />
          )}
        </div>
      </div>
    )}
      {images.length === 0 ? (
        <p>No images found or not running inside Tauri (make sure your picture directory has images in it).</p>
      ): (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((src) => {
            const isSelected = selectedStoryURLs.includes(src);

            return (
            <div key={src} className="relative overflow-hidden rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-500 transition">
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={isSelected ? "Selected" : "Not selected"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(src);
                }}
                className={`absolute top-1 left-1 w-7 h-7 rounded-full border-2
                  flex items-center justify-center text-sm font-bold cursor-pointer
                  transition-colors
                  ${isSelected
                    ? "bg-blue-500 border-blue-300 text-white"
                    : "bg-black/50 border-white/70 text-transparent hover:border-white"}`}
              > ✓ </button>
              
              <img  
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              onClick={() => setSelected(src)}
              className="w-full h-48 object-cover rounded-lg" />
            </div>
          );
        })}
        </div>
      )}
      <Lightbox selected={selected} onClose={handleClose} onNavigate={handleNavigate} />

      {selectedStoryURLs.length >= 2 && (
        <button
          onClick={handleStory}
          disabled={storyLoading}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-xl cursor-pointer"
        >
          {`Write story (${selectedStoryURLs.length} photos)`}
        </button>
      )}

      {storyPanelOpen && (
        <div className="fixed bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto bg-slate-800 border-t border-slate-700 p-8 z-40">
          <h2 className="text-xl font-bold mb-4">Story Generator</h2>
          {storyLoading && !story ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin"></div>
              <p className="text-slate-400">Generating story...</p>
            </div>
          ) : (
          <p className="whitespace-pre-wrap text-slate-200 max-w-4xl leading-relaxed">{story}</p>
          )}
          <button onClick={handleStory} className="relative bottom left p-2 mt-4 text-slate-400 hover:text-white cursor-pointer">
            ↻ New Story
          </button>
          |
          <button onClick={() => setStoryPanelOpen(false)} className="relative bottom left p-2 mt-4 text-slate-400 hover:text-white cursor-pointer">
            Close
          </button>
        </div>
      )}
    </main>
  );
}