# Webpack Inline Manifest Plugin

[![CI](https://github.com/almothafar/webpack-inline-manifest-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/almothafar/webpack-inline-manifest-plugin/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/webpack-inline-manifest-plugin.svg)](https://www.npmjs.com/package/webpack-inline-manifest-plugin) [![npm downloads](https://img.shields.io/npm/dt/webpack-inline-manifest-plugin.svg)](https://www.npmjs.com/package/webpack-inline-manifest-plugin) [![license](https://img.shields.io/npm/l/webpack-inline-manifest-plugin.svg)](https://github.com/almothafar/webpack-inline-manifest-plugin/blob/master/LICENSE)

A [webpack](https://webpack.js.org/) plugin that **inlines the runtime/manifest chunk** with a `<script>` tag, saving one render-blocking HTTP request.

webpack's runtime is small but changes on almost every build. The common pattern is to split it into its own chunk (`optimization.runtimeChunk`) so the rest of your bundles stay long-term cacheable — but then that tiny chunk costs a separate request. This plugin embeds it directly into the HTML produced by [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) so you get the caching benefit without the extra request.

## Requirements

| webpack-inline-manifest-plugin | webpack | html-webpack-plugin | Node.js  |
| ------------------------------ | ------- | ------------------- | -------- |
| **5.x** (this version)         | 5       | 5                   | >= 10.13 |
| 4.x                            | 4       | 3                   | >= 8     |

> For **webpack 4 / html-webpack-plugin 3**, stay on [v4.0.2](https://www.npmjs.com/package/webpack-inline-manifest-plugin/v/4.0.2).

## Installation

```shell
npm install webpack-inline-manifest-plugin --save-dev
```

`webpack` and `html-webpack-plugin` are peer dependencies — you almost certainly already have them.

## Usage

### Step 1 — split out the runtime chunk

```js
// webpack.config.js
module.exports = {
  optimization: {
    // The chunk name must match the plugin's `name` option below.
    runtimeChunk: { name: 'webpackManifest' },
  },
};
```

> Using `runtimeChunk: 'single'` instead? That names the chunk `runtime`, so set the
> plugin's `name` option to `'runtime'`.

### Step 2 & 3 — add the plugins

Add `WebpackInlineManifestPlugin` **after** `HtmlWebpackPlugin`:

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackInlineManifestPlugin = require('webpack-inline-manifest-plugin');

module.exports = {
  // ...
  plugins: [
    new HtmlWebpackPlugin(),
    new WebpackInlineManifestPlugin({
      name: 'webpackManifest', // must equal the runtimeChunk name (default: 'webpackManifest')
    }),
  ],
};
```

That's it. With html-webpack-plugin's default `inject: true`, the plugin finds the
external `<script src="webpackManifest.js">` tag and **replaces it inline, in place** —
so load order is preserved and nothing else in your template needs to change.

### Manual placement (template mode)

If you render your own template with `inject: false`, the inline `<script>` is exposed
as `htmlWebpackPlugin.files[name]` so you can place it wherever you like:

```js
new HtmlWebpackPlugin({
  inject: false,
  template: 'src/index.ejs',
});
```

```html
<!-- src/index.ejs -->
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>App</title>
  </head>
  <body>
    <%= htmlWebpackPlugin.files.webpackManifest %>
  </body>
</html>
```

## Options

| Option | Type     | Default             | Description                                                                                                                                                                                                                                          |
| ------ | -------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` | `string` | `'webpackManifest'` | The runtime chunk to inline. **Must match** your `optimization.runtimeChunk` name. Also the key used for `htmlWebpackPlugin.files[name]` in template mode. Cannot be `"manifest"` (reserved by html-webpack-plugin for the HTML5 appcache manifest). |

## How it works

- **`inject: true`** (default): taps html-webpack-plugin's `alterAssetTagGroups` hook
  and swaps the runtime's `<script src>` tag for an inline `<script>` containing its
  code. `nonce` / `type` attributes are preserved (handy for CSP), while `src` / `defer`
  / `async` are dropped.
- **`inject: false`**: taps `beforeAssetTagGeneration`, removes the runtime from the
  external asset list, and exposes the inline markup as `htmlWebpackPlugin.files[name]`.
- A trailing `//# sourceMappingURL=` comment is stripped from the inlined code, and the
  asset source is normalised with `.toString()` so it works for production builds where
  webpack emits a `Buffer` (`RawSource`) instead of a string.

The runtime chunk file is still emitted to your output directory (unreferenced); leaving
it in place avoids breaking external references and service-worker precaches.

## Alternatives

This optimization matters less than it did under HTTP/1.1 (HTTP/2+ multiplexes small
requests cheaply), and inline scripts require `'unsafe-inline'` or a nonce/hash under a
strict Content-Security-Policy. If this plugin's runtime-specific, zero-config approach
(and its template-variable mode) isn't what you need, these maintained, general-purpose
options inline scripts on webpack 5 too:

- [**html-inline-script-webpack-plugin**](https://github.com/icelam/html-inline-script-webpack-plugin)
  — inline any script by filename, e.g. `scriptMatchPattern: [/runtime.*\.js$/]`.
- **`InlineChunkHtmlPlugin`** from `react-dev-utils` (used by the now-deprecated Create
  React App) — same `alterAssetTagGroups` technique.

## Migration from v4

- **Requires webpack 5 + html-webpack-plugin 5.** This is the fix for the
  `Cannot read property 'tapAsync' of undefined` crash on html-webpack-plugin v4+
  ([#27](https://github.com/szrenwei/inline-manifest-webpack-plugin/issues/27),
  [#23](https://github.com/szrenwei/inline-manifest-webpack-plugin/issues/23)).
- **Automatic injection now works with `inject: true`.** In v4 you had to use a template
  variable; now the runtime is inlined for you. The `htmlWebpackPlugin.files[name]`
  variable still works with `inject: false`.
- **The chunk lookup now honors `name`.** v4 hard-coded a lookup for a chunk literally
  named `manifest`; v5 finds the chunk named by your `name` option. Make sure `name`
  matches your `optimization.runtimeChunk` name.
- **TypeScript types are bundled** (`index.d.ts`).

## License

[MIT](LICENSE)
