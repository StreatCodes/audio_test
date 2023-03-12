import * as esbuild from "esbuild";
import { denoPlugin } from "esbuild-deno-loader";

await esbuild.build({
  plugins: [denoPlugin({
    importMapURL: new URL("./deno.json", import.meta.url),
  })],
  entryPoints: ["./frontend/index.tsx"],
  bundle: true,
  minify: true,
  outfile: "static/bundle.js"
});

esbuild.stop();