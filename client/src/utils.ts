import { EmbedRequest, Ollama } from "ollama";

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })

export const getEmbedding = async (input: EmbedRequest["input"]) => {
  const output = await ollama.embed({ model: "mxbai-embed-large", input });
  return output.embeddings;
};
