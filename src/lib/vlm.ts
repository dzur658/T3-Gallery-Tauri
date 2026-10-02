// src/lib/vlm.ts
import { 
  AutoProcessor,
  AutoModelForImageTextToText,
 } from "@huggingface/transformers";

async function createVLM() {
  const model_id = "onnx-community/gemma-3n-E2B-it-ONNX";
  const processor = await AutoProcessor.from_pretrained(model_id);
  const model = await AutoModelForImageTextToText.from_pretrained(model_id, {
    dtype: {
      audio_encoder: "fp32",
      vision_encoder: "fp32",
      embed_tokens: "q4",
      decoder_model_merged: "q4",
    },
    device: navigator.gpu ? "webgpu" : "cpu"
  })

  return { processor, model };
}

// the precise type, derived from the real call:
type VLM = Awaited<ReturnType<typeof createVLM>>;

let vlmPromise: Promise<VLM> | null = null;

export function getVLM(): Promise<VLM> {
  if (!vlmPromise) {
    vlmPromise = createVLM();
  }
  return vlmPromise;
}