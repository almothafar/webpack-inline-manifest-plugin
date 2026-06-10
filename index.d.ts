import type { Compiler } from 'webpack';

declare namespace WebpackInlineManifestPlugin {
	interface Options {
		/**
		 * The name of the runtime/manifest chunk to inline. It must match the name
		 * of your webpack `optimization.runtimeChunk` chunk.
		 *
		 * It is also the key the inline markup is exposed under in templates as
		 * `htmlWebpackPlugin.files[name]`, used when html-webpack-plugin's `inject`
		 * option is `false`.
		 *
		 * Cannot be `"manifest"` (reserved by html-webpack-plugin for the HTML5
		 * appcache manifest).
		 *
		 * @default "webpackManifest"
		 */
		name?: string;
	}
}

declare class WebpackInlineManifestPlugin {
	constructor(options?: WebpackInlineManifestPlugin.Options);
	apply(compiler: Compiler): void;
}

export = WebpackInlineManifestPlugin;
