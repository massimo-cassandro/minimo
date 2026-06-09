import terser  from '@rollup/plugin-terser';
import node_resolve from '@rollup/plugin-node-resolve';
import image from '@rollup/plugin-image';

import p from '../package.json' assert { type: 'json' };

export default [
  {
    input: './demo/demo.js',
    plugins: [
      node_resolve(),
      // commonjs(),
      image(),
      terser({ compress: { passes: 2 } }),
    ],
    output: [
      {
        file: './demo/unsplash-page-demo.min.js',
        format: 'iife',
        sourcemap: true,
        banner: `/*! Unsplash Page v.${p.version} - Massimo Cassandro ${new Date().toLocaleString('en-EN', {
          year: 'numeric',  month: 'long', day: 'numeric' })} */`
      }
    ]
  }
];
