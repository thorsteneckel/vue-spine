const buble = require('rollup-plugin-buble')
const replace = require('rollup-plugin-replace')
const version = process.env.VERSION || require('../package.json').version

module.exports = {
  entry: process.env.ESM ? 'src/index.esm.js' : 'src/index.js',
  dest: process.env.ESM ? 'dist/vue-spine.esm.js' : 'dist/vue-spine.js',
  format: process.env.ESM ? 'es' : 'umd',
  moduleName: 'Vue-Spine',
  plugins: [
    replace({ __VERSION__: version }),
    buble()
  ],
  banner:
`/**
 * vue-spine v${version}
 * (c) ${new Date().getFullYear()} Thorsten Eckel
 * @license MIT
 */`
}
