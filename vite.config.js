import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this project from /<repo-name>/, not the domain root.
  // Keep dev server at "/" so `npm run dev` still works normally.
  base: command === "build" ? "/adaptive-learning-companion/" : "/",
  plugins: [react(), tailwindcss()],
}));
