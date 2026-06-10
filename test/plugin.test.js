'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackInlineManifestPlugin = require('..');

const FIXTURES = path.join(__dirname, 'fixtures');
const RUNTIME_CHUNK = 'webpackManifest';
const tmpDirs = [];

function compile({ html, plugin, runtimeName = RUNTIME_CHUNK, devtool } = {}) {
	const outputPath = fs.mkdtempSync(path.join(os.tmpdir(), 'wimp-'));
	tmpDirs.push(outputPath);

	const optimization =
		runtimeName === false ? { runtimeChunk: false } : { runtimeChunk: { name: runtimeName } };

	const compiler = webpack({
		mode: 'production',
		devtool,
		context: FIXTURES,
		entry: './entry.js',
		output: { path: outputPath, filename: '[name].js' },
		optimization,
		plugins: [new HtmlWebpackPlugin(html), new WebpackInlineManifestPlugin(plugin)],
	});

	return new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			compiler.close(() => {
				if (err) {
					return reject(err);
				}
				if (stats.hasErrors()) {
					return reject(new Error(stats.toString({ all: false, errors: true })));
				}

				const output = fs.readFileSync(path.join(outputPath, 'index.html'), 'utf8');
				const runtimePath = runtimeName && path.join(outputPath, `${runtimeName}.js`);
				const runtimeCode =
					runtimePath && fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, 'utf8') : null;

				resolve({ html: output, runtimeCode, outputPath });
			});
		});
	});
}

afterAll(() => {
	for (const dir of tmpDirs) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

describe('WebpackInlineManifestPlugin', () => {
	test('inlines the runtime chunk and drops its external <script> (inject mode)', async () => {
		const { html, runtimeCode } = await compile();

		expect(runtimeCode).toBeTruthy();
		// The runtime is no longer requested over the network...
		expect(html).not.toMatch(/<script[^>]+src=["'][^"']*webpackManifest[^"']*\.js/);
		// ...because its code is embedded directly in the page.
		expect(html).toContain(runtimeCode.trim());
	});

	test('exposes htmlWebpackPlugin.files[name] for manual placement (inject: false)', async () => {
		const { html, runtimeCode } = await compile({
			html: {
				inject: false,
				templateContent: ({ htmlWebpackPlugin }) =>
					'<!doctype html><html><head><meta charset="utf-8"></head>' +
					`<body>${htmlWebpackPlugin.files.webpackManifest}</body></html>`,
			},
		});

		expect(html).toContain('<script>');
		expect(html).toContain(runtimeCode.trim());
		expect(html).not.toMatch(/src=["'][^"']*webpackManifest[^"']*\.js/);
	});

	test('supports a custom runtime chunk name', async () => {
		const { html, runtimeCode } = await compile({
			runtimeName: 'runtime',
			plugin: { name: 'runtime' },
		});

		expect(runtimeCode).toBeTruthy();
		expect(html).toContain(runtimeCode.trim());
		expect(html).not.toMatch(/<script[^>]+src=["'][^"']*runtime[^"']*\.js/);
	});

	test('is a no-op (does not crash) when there is no runtime chunk', async () => {
		const { html } = await compile({ runtimeName: false });

		// The build still succeeds and the main bundle is injected normally.
		expect(html).toMatch(/<script[^>]+src=["'][^"']*main\.js/);
	});

	test('strips the sourceMappingURL comment from the inlined runtime', async () => {
		const { html, runtimeCode } = await compile({ devtool: 'source-map' });

		// The on-disk runtime still references its external map file...
		expect(runtimeCode).toMatch(/sourceMappingURL/);
		// ...but the inlined copy must not (the map file isn't inlined with it).
		expect(html).not.toMatch(/sourceMappingURL/);
	});

	test('throws when name is "manifest"', () => {
		const plugin = new WebpackInlineManifestPlugin({ name: 'manifest' });
		expect(() => plugin.apply({})).toThrow(/can't be "manifest"/);
	});
});
