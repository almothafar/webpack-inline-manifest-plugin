// A couple of modules so webpack produces a real runtime/manifest chunk
// (with `optimization.runtimeChunk`) that the plugin can inline.
import { greet } from './lib';

console.log(greet('webpack-inline-manifest-plugin'));
