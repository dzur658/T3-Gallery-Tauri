// src/lib/vlm.ts
/// <reference types="@webgpu/types" />

import { 
  AutoProcessor,
  AutoModelForImageTextToText,
  load_image,
  PreTrainedTokenizer,
  TextStreamer,
 } from "@huggingface/transformers";

 import type { Tensor } from "@huggingface/transformers";

 import { makeProgressHandler, type ProgressUpdate } from "./download-progress";

async function createVLM(update?: ProgressUpdate) {
  const onProgress = makeProgressHandler(update);

  const model_id = "onnx-community/gemma-3n-E2B-it-ONNX";
  const processor = await AutoProcessor.from_pretrained(model_id, { progress_callback: onProgress });
  const model = await AutoModelForImageTextToText.from_pretrained(model_id, {
    dtype: {
      audio_encoder: "fp32",
      vision_encoder: "fp32",
      embed_tokens: "q4",
      decoder_model_merged: "q4",
    },
    device: navigator.gpu ? "webgpu" : "cpu",
    progress_callback: onProgress,
  })

  return { processor, model };
}

async function getVLMResponse(input: string, images: string[], greedy: boolean, onToken?: (token: string) => void): Promise<void> {
  const { processor, model } = await getVLM();

  const tokenizer = processor.tokenizer;

  // check type for tokenizer
  if (!(tokenizer instanceof PreTrainedTokenizer)) {
    throw new Error("VLM Error: Invalid Tokenizer.");
  }
    const messages = [
      {
        role: "user",
        content: [
          ...images.map((url) => ({ type: "image", image: url })),
          { type: "text", text: input },
        ],
      },
    ];

    const prompt = processor.apply_chat_template(messages, {
      add_generation_prompt: true,
    });

    const imageList = await Promise.all(images.map(load_image));

    const inputs = (await processor(prompt, imageList, null, {
      add_special_tokens: false,
    })) as Record<string, Tensor>;

    await model.generate({
      ...inputs,
      max_new_tokens: 500,
      do_sample: !greedy,
      temperature: greedy ? 0 : 0.7,
      streamer: new TextStreamer(tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text: string) => {
          onToken?.(text);
        }
      }),
    });
  }

type VLM = Awaited<ReturnType<typeof createVLM>>;

let vlmPromise: Promise<VLM> | null = null;

export function getVLM(update?: ProgressUpdate): Promise<VLM> {
  vlmPromise ??= createVLM(update);
  return vlmPromise;
}

export { getVLMResponse };