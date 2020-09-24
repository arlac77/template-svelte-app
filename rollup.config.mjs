import { readFileSync } from "fs";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import virtual from "@rollup/plugin-virtual";

import svelte from "rollup-plugin-svelte";
import postcss from "rollup-plugin-postcss";
import postcssImport from "postcss-import";

import { terser } from "rollup-plugin-terser";
import dev from "rollup-plugin-dev";
import consts from "rollup-plugin-consts";

const production = !process.env.ROLLUP_WATCH;
const dist = "public";
const bundlePrefix = `${dist}/bundle.`;
const port = 5000;

const { name, description, version, config } = JSON.parse(
  readFileSync("./package.json", { endoding: "utf8" })
);

const external = [];

const prePlugins = [
  virtual({
    "node-fetch": "export default fetch",
    stream: "export class Readable {}"
  }),
  consts({
    name,
    version,
    description,
    ...config
  })
];

const resolverPlugins = [
  resolve({
    browser: true,
    preferBuiltins: false,
    dedupe: importee => importee === "svelte" || importee.startsWith("svelte/")
  }),
  commonjs()
];

export default [
  {
    input: "src/main.mjs",
    output: {
      interop: false,
      sourcemap: true,
      format: "esm",
      file: `${bundlePrefix}main.mjs`,
      plugins: [production && terser()]
    },
    plugins: [
      ...prePlugins,
      postcss({
        extract: true,
        sourceMap: true,
        minimize: production,
        plugins: [postcssImport]
      }),
      svelte({
        dev: !production,
        emitCss: true
      }),
      ...resolverPlugins,
      !production &&
        dev({
          port,
          dirs: [dist],
          spa: `${dist}/index.html`,
          basePath: config.base,
          proxy: {
            [`${config.api}/*`]: [config.proxyTarget, { https: true }]
          }
        })
    ],
    external,
    watch: {
      clearScreen: false
    }
  },
  {
    input: "src/service-worker.mjs",
    output: {
      interop: false,
      sourcemap: true,
      format: "esm",
      file: `${bundlePrefix}service-worker.mjs`,
      plugins: [production && terser()]
    },
    plugins: [...prePlugins, ...resolverPlugins].external
  }
];
