"use client";

import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { pictureDir, join } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";
import Lightbox from "./components/Lightbox";
import { load_image, TextStreamer, PreTrainedTokenizer } from "@huggingface/transformers";

import { getVLM } from "../lib/vlm";

// image cache
const imageCache = new Map<string, Awaited<ReturnType<typeof load_image>>>();

async function getLoadedImage(url: string) {
  let img = imageCache.get(url);
  if (!img) {
    img = await load_image(url);
    imageCache.set(url, img);
  }
  return img;
}

export default function Page() {
  const [images, setImages] = useState<string[]>([]);

  // picture clicker tracker
  const [selected, setSelected] = useState<string | null>(null);

  // path selection for image story
  const [selectedStoryURLs, setSelectedStoryURLs] = useState<string[]>([]);

  const [story, setStory] = useState<string | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);

  const toggleSelect = (url: string) =>
    setSelectedStoryURLs((prev) =>
    prev.includes(url)
      ? prev.filter((u) => u !== url)
      : prev.length < 5 ? [...prev, url] : prev
    );

    const handleStory = async ( ) => {
      setStoryLoading(true);
      setStory("");
      try {
        const { processor, model } = await getVLM();
  
        const tokenizer = processor.tokenizer;
  
        if (tokenizer instanceof PreTrainedTokenizer) {
  
          const messages = [
          {
            role: "user",
            content: [
              ...selectedStoryURLs.map((url) => ({ type: "image", image: url })),
              { type: "text", text: `You write REALLY FUNNY STORIES but you've only ever seen these ${selectedStoryURLs.length} images.
              Write a story that connects the dots however absurd it may be. You are not allowed to describe the photos individually,
              you must weave them all together into a semi-coherent story. Emoji use is permitted for irony. Your story can be no longer than
              15 sentences long.` },
            ],
          },
        ];
        
        const prompt = processor.apply_chat_template(messages, {
          add_generation_prompt: true,
        });
        
        // adapted for multiple images
        const imageList = await Promise.all(selectedStoryURLs.map(getLoadedImage));
        const audio = null;
        const inputs = await processor(prompt, imageList, audio, {
          add_special_tokens: false,
        });
  
        const out = await model.generate({
          ...inputs,
          max_new_tokens: 500,
          do_sample: true,
          temperature: 0.7,
          streamer: new TextStreamer(tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (text: string) => {
              setStory((prev) => (prev ?? "") + text);
            }
          }),
        });
      } else {
        console.error("VLM error: Invalid input types");
      }
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
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-progress"
        >
          {storyLoading ? "Writing a GREAT story..." : `Write story (${selectedStoryURLs.length} photos)`}
        </button>
      )}

      {story && (
        <div className="fixed bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto bg-slate-900/95 border-t border-slate-700 p-8 z-40">
          <h2 className="text-xl font-bold mb-4">The Story</h2>
          <p className="whitespace-pre-wrap text-slate-200 leading-relaxed">{story}</p>
          <button onClick={() => setStory(null)} className="mt-4 text-slate-400 hover:text-white cursor-pointer">
            Close
          </button>
        </div>
      )}
    </main>
  );
}