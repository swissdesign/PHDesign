import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  output: "server",
  integrations: [react()],
  adapter: vercel(),
  image: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "drive.usercontent.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }
    ],
  },
});
