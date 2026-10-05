import type { ProgressCallback } from "@huggingface/transformers";

export type ProgressUpdate = (overallPercent: number) => void;

export function makeProgressHandler(update?: ProgressUpdate): ProgressCallback {
  return (event) => {
    console.log("Event status:",event.status);
    if (event.status === "progress_total" && update) {
      update(Math.round(event.progress));
      return;
    }
  };
}