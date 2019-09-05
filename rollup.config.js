import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import { terser } from "rollup-plugin-terser";
import copy from 'rollup-plugin-copy';
import { spawn } from "child_process";
import { config } from "./package.json";

const production = !process.env.ROLLUP_WATCH;
const dist = "public";

if (!production) {
  const ls = spawn("./node_modules/.bin/light-server", [
    "-s",
    dist,
    "--servePrefix",
    config.urlPrefix,
    "--historyindex",
    config.urlPrefix + "/index.html",
    "-p",
    "5000",
    "--proxypath",
    config.api,
    "-x",
    config.proxyTarget,
    "-w", `${dist}/*.mjs,${dist}/*.css`
  ]);
  ls.stdout.pipe(process.stdout);
}

export default {
  input: "src/main.mjs",
  output: {
    sourcemap: true,
    format: "esm",
    file: `${dist}/bundle.mjs`
  },
  plugins: [
    copy({
      targets: [
        { src: 'node_modules/mf-styling/global.css', dest: dist }
      ]
    }),
    svelte({
      dev: !production,
    }),

    resolve({ browser: true }),
    commonjs(),
    json({
      preferConst: true,
      compact: true
    }),
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};