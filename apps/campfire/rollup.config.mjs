import path from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'rollup-plugin-esbuild'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import alias from '@rollup/plugin-alias'
import replace from '@rollup/plugin-replace'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  input: path.join(__dirname, 'src', 'main.tsx'),
  output: {
    file: path.join(__dirname, 'dist', 'main.js'),
    format: 'iife'
  },
  plugins: [
    resolve({ browser: true, extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
    alias({
      entries: {
        '@/packages': path.resolve(__dirname, '../../packages')
      }
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV ?? 'production'
      )
    }),
    commonjs(),
    json(),
    esbuild({
      tsconfig: path.join(__dirname, 'tsconfig.json'),
      target: 'esnext',
      jsx: 'automatic',
      minify: true
    })
  ]
}
