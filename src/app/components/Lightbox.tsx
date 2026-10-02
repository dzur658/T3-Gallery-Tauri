"use client";

import { useEffect, useState } from "react";

import { load_image, TextStreamer, PreTrainedTokenizer } from "@huggingface/transformers"

import { getVLM } from "../../lib/vlm";

interface LightboxProps {
  selected: string | null;
  onClose: () => void;
  onNavigate: (direction: 1 | -1) => void;
}

export default function Lightbox({ selected, onClose, onNavigate }: LightboxProps) {
  const [caption, setCaption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCaption = async ( ) => {
    setLoading(true);
    setCaption("");
    try {
      const { processor, model } = await getVLM();

      const tokenizer = processor.tokenizer;

      if (typeof selected === "string" && tokenizer instanceof PreTrainedTokenizer) {

        const messages = [
        {
          role: "user",
          content: [
            { type: "image", image: selected },
            { type: "text", text: "Describe this photo in one vivid sentence." },
          ],
        },
      ];
      
      const prompt = processor.apply_chat_template(messages, {
        add_generation_prompt: true,
      });

      const image = await load_image(selected);
      const audio = null;
      const inputs = await processor(prompt, image, audio, {
        add_special_tokens: false,
      });

      const out = await model.generate({
        ...inputs,
        max_new_tokens: 100,
        do_sample: false,
        streamer: new TextStreamer(tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (text: string) => {
            console.log("VLM output:", text);
            setCaption((prev) => (prev ?? "") + text);
          }
        }),
      });
    } else {
      console.error("VLM error: Invalid input types");
    }
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

      <button
        onClick={handleCaption}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg cursor-pointer"
      >
        {loading ? "Thinking…" : "Caption this"}
      </button>
      {caption && <p className="mt-3 text-white text-sm max-w-xl text-center">{caption}</p>}
    </div>
  );
}