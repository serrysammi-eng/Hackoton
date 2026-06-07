import { createFileRoute } from "@tanstack/react-router";
import { youtubeApiKey } from "@/lib/config.server";

export const Route = createFileRoute("/api/video")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get("q") || url.searchParams.get("query");
        if (!query) {
          return new Response(JSON.stringify({ error: "Missing query parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            query,
          )}&type=video&maxResults=1&key=${youtubeApiKey}`;

          console.log(`Searching YouTube Data API for: "${query}"`);
          const res = await fetch(ytUrl);

          if (!res.ok) {
            throw new Error(`YouTube API returned status ${res.status}`);
          }

          const data = (await res.json()) as {
            items?: Array<{
              id?: {
                videoId?: string;
              };
            }>;
          };

          const videoId = data.items?.[0]?.id?.videoId;
          if (!videoId) {
            console.warn(`No video found for query: "${query}"`);
            return new Response(JSON.stringify({ error: "no video found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log(`Found YouTube video ID: ${videoId}`);
          return new Response(JSON.stringify({ videoId }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("YouTube search API failed:", error);
          return new Response(JSON.stringify({ error: "no video found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
