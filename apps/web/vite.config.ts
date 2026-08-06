import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  cacheDir: process.env.VITE_CACHE_DIR ?? "/tmp/fleet-platform-vite-cache",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false
      },
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Fleet Platform",
        short_name: "Fleet",
        description: "Gestão de veículos, custos, quilometragem e manutenções com suporte offline.",
        lang: "pt-BR",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg}"]
      }
    })
  ],
  server: {
    host: process.env.VITE_HOST ?? "127.0.0.1",
    port: Number(process.env.VITE_PORT ?? 5173),
    allowedHosts: [
        "fleet.gustavoloper.xyz"
    ]
  }
});
