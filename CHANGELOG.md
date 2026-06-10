# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0]

### Breaking

- **Requires webpack 5 and html-webpack-plugin 5.** Support for webpack 4 /
  html-webpack-plugin 3 is dropped; stay on `4.0.2` for those.
- Peer dependencies are now `webpack@^5.20.0` and `html-webpack-plugin@^5.0.0`.

### Added

- **Automatic injection** with html-webpack-plugin's default `inject: true`: the runtime's
  external `<script src>` tag is replaced inline, in place, with no template changes.
- Bundled TypeScript definitions (`index.d.ts`).
- `nonce` / `type` attributes are preserved when inlining (CSP / `type="module"` support).
- Jest test suite and a GitHub Actions CI matrix (Node 18 / 20 / 22).

### Fixed

- **Compatibility with html-webpack-plugin v4+** — uses
  `HtmlWebpackPlugin.getCompilationHooks(compilation)` instead of the removed
  `compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration`, fixing the
  `Cannot read property 'tapAsync' of undefined` crash
  ([upstream #27](https://github.com/szrenwei/inline-manifest-webpack-plugin/issues/27),
  [#23](https://github.com/szrenwei/inline-manifest-webpack-plugin/issues/23)).
- **webpack 5 data structures** — `compilation.chunks` and `chunk.files` are now `Set`s;
  the plugin iterates them correctly instead of relying on array methods.
- **Production builds** — the asset source is normalised with `.toString()` so a `Buffer`
  (`RawSource`) source no longer throws
  ([#3](https://github.com/almothafar/webpack-inline-manifest-plugin/pull/3)).
- The runtime chunk is now located by the configured `name` instead of a hard-coded
  `manifest` chunk name.

### Changed

- Tooling modernised: ESLint 9 flat config + Prettier (replacing `eslint-config-standard`),
  GitHub Actions (replacing CircleCI), and `source-map-url@^0.4.1`.

## [4.0.2] and earlier

See the [releases page](https://github.com/almothafar/webpack-inline-manifest-plugin/releases).
