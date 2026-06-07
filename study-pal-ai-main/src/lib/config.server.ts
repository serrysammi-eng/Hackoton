import process from "node:process";

export const youtubeApiKey = process.env.YOUTUBE_API_KEY;

if (!youtubeApiKey) {
  throw new Error("Missing YOUTUBE_API_KEY in environment");
}

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
  };
}
