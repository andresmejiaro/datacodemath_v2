import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

export default defineConfig({
  output: "static",
  site: "https://andresmejiaro.github.io",
  base: "/datacodemath_v2",
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()]
  }
});
