import { createFileRoute } from "@tanstack/react-router";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks/search",
  "https://piped-api.garudalinux.org/search",
  "https://api.piped.projectsegfau.lt/search",
  "https://pipedapi.in.projectsegfau.lt/search",
];

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

        for (const instanceBase of PIPED_INSTANCES) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const pipedUrl = `${instanceBase}?q=${encodeURIComponent(query)}&filter=videos`;

          try {
            console.log(`Attempting Piped API search: ${pipedUrl}`);
            const res = await fetch(pipedUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) {
              throw new Error(`Status ${res.status}`);
            }

            const data = (await res.json()) as {
              items?: Array<{ type?: string; url?: string }>;
            };

            const firstVideo = data.items?.find(
              (item) => item.type === "stream" || item.url?.includes("v="),
            );

            let videoId: string | null = null;
            if (firstVideo && firstVideo.url) {
              videoId = firstVideo.url.split("v=")[1]?.split("&")[0] || null;
            }

            console.log(
              `Successfully retrieved results from ${instanceBase}. Video ID: ${videoId}`,
            );
            return new Response(JSON.stringify({ videoId }), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (error) {
            clearTimeout(timeoutId);
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Piped instance failed: ${instanceBase} - Error: ${errorMessage}`);
            // Continue to next instance
          }
        }

        // If all instances fail, attempt direct YouTube search scraping fallback
        console.warn(
          "All Piped API instances failed or timed out. Attempting direct YouTube scraping fallback...",
        );
        try {
          const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " explained educational")}`;
          console.log(`Attempting YouTube fallback search: ${ytUrl}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(ytUrl, {
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const html = await res.text();
            const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            if (match && match[1]) {
              const videoId = match[1];
              console.log(`Successfully retrieved fallback video ID from YouTube: ${videoId}`);
              return new Response(JSON.stringify({ videoId }), {
                headers: { "Content-Type": "application/json" },
              });
            }
          }
        } catch (error) {
          console.error("YouTube fallback search failed:", error);
        }

        // If all fallbacks fail
        console.error("All Piped API instances and YouTube fallback failed.");
        return new Response(JSON.stringify({ error: "no video found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
