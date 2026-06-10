'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');

const PLUGIN = 'WebpackInlineManifestPlugin';

// Matches a trailing `//# sourceMappingURL=...` annotation (and the `/*# ... */`
// block form, plus the legacy `@` syntax) so the inlined runtime doesn't point
// at a now-orphaned map file. Mirrors the (deprecated) `source-map-url` package.
const SOURCE_MAPPING_URL_REGEX =
	/(?:\/\*(?:\s*\r?\n(?:\/\/)?)?(?:[#@] sourceMappingURL=[^\s'"]*)\s*\*\/|\/\/(?:[#@] sourceMappingURL=[^\s'"]*))\s*/;

class WebpackInlineManifestPlugin {
	constructor(options = {}) {
		this.options = { name: 'webpackManifest', ...options };
	}

	apply(compiler) {
		const { name } = this.options;

		// html-webpack-plugin reserves `manifest` for the HTML5 appcache manifest,
		// so it can't be reused as our chunk/template name.
		if (name === 'manifest') {
			throw new Error(`[${PLUGIN}]: "name" can't be "manifest".`);
		}

		compiler.hooks.compilation.tap(PLUGIN, (compilation) => {
			// `getCompilationHooks` is html-webpack-plugin v5; `getHooks` is the v4
			// alias kept for safety. A missing function means an incompatible (v3)
			// version is installed.
			const getHooks = HtmlWebpackPlugin.getCompilationHooks || HtmlWebpackPlugin.getHooks;

			if (typeof getHooks !== 'function') {
				throw new Error(
					`[${PLUGIN}]: html-webpack-plugin >= 5 is required, and it must be ` +
						'added to your `plugins` before WebpackInlineManifestPlugin.'
				);
			}

			const hooks = getHooks.call(HtmlWebpackPlugin, compilation);

			// Template mode (`inject: false`): expose the inline markup as
			// `htmlWebpackPlugin.files[name]` and drop the runtime from the external
			// asset list so it isn't requested twice.
			hooks.beforeAssetTagGeneration.tapAsync(PLUGIN, (data, cb) => {
				const runtime = getInlineRuntime(compilation, name);
				const injectEnabled = data.plugin.options.inject !== false;

				if (runtime && !injectEnabled) {
					removeFromAssets(data.assets.js, runtime.file);
					data.assets[name] = `<script>${runtime.code}</script>`;
				} else {
					data.assets[name] = '';
				}

				cb(null, data);
			});

			// Inject mode (`inject` !== false): replace the external runtime
			// `<script src>` tag with an inline one, in place, so ordering is kept.
			hooks.alterAssetTagGroups.tapAsync(PLUGIN, (data, cb) => {
				if (data.plugin.options.inject === false) {
					return cb(null, data);
				}

				const runtime = getInlineRuntime(compilation, name);
				if (runtime) {
					inlineRuntimeTag(data.headTags, runtime);
					inlineRuntimeTag(data.bodyTags, runtime);
				}

				cb(null, data);
			});
		});
	}
}

// Find the emitted `.js` file for the runtime chunk. `compilation.chunks` and
// `chunk.files` are `Set`s in webpack 5 (they were arrays in webpack 4); both
// are iterable, so `for...of` handles either.
function getRuntimeFile(compilation, chunkName) {
	for (const chunk of compilation.chunks) {
		if (chunk.name !== chunkName) {
			continue;
		}
		for (const file of chunk.files) {
			if (file.endsWith('.js')) {
				return file;
			}
		}
	}
	return null;
}

function getInlineRuntime(compilation, chunkName) {
	const file = getRuntimeFile(compilation, chunkName);
	const asset = file && compilation.assets[file];
	if (!asset) {
		return null;
	}

	return {
		file,
		// `source()` returns a Buffer for some asset types (e.g. RawSource in
		// production builds), so normalise to a string before stripping the map.
		code: removeSourceMappingURL(asset.source().toString()),
	};
}

function removeSourceMappingURL(code) {
	return code.replace(SOURCE_MAPPING_URL_REGEX, '');
}

function removeFromAssets(jsAssets, file) {
	const index = jsAssets.findIndex((src) => src.endsWith(file));
	if (index !== -1) {
		jsAssets.splice(index, 1);
	}
}

function inlineRuntimeTag(tags, runtime) {
	if (!Array.isArray(tags)) {
		return;
	}

	for (let i = 0; i < tags.length; i++) {
		const tag = tags[i];
		const src = tag && tag.attributes && tag.attributes.src;

		if (tag.tagName === 'script' && typeof src === 'string' && src.endsWith(runtime.file)) {
			// Drop `src`/`defer`/`async` (meaningless for an inline script) but keep
			// attributes such as `nonce` and `type` for CSP / module compatibility.
			// eslint-disable-next-line no-unused-vars
			const { src: _src, defer, async, ...attributes } = tag.attributes;

			tags[i] = {
				tagName: 'script',
				voidTag: false,
				meta: { plugin: PLUGIN },
				attributes,
				innerHTML: runtime.code,
			};
		}
	}
}

module.exports = WebpackInlineManifestPlugin;
module.exports.default = WebpackInlineManifestPlugin;
