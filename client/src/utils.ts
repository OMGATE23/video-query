import { EmbedRequest, Ollama } from "ollama";

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })

export const getEmbedding = async (input: EmbedRequest["input"]) => {
  const output = await ollama.embed({ model: "mxbai-embed-large", input });
  return output.embeddings;
};

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  return `${minutes}:${formattedSeconds}`;
}