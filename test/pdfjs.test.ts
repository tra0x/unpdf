/* eslint-disable ts/ban-ts-comment */
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { definePDFJSModule, extractText, getResolvedPDFJS } from '../src/index'
import { getPDF } from './utils'

describe('pdfjs resolution', () => {
  it('polyfills Math.sumPrecise for the serverless build', () => {
    const { sumPrecise } = Math as typeof Math & {
      sumPrecise: (items: Iterable<number>) => number
    }

    expect(typeof sumPrecise).toBe('function')
    expect(sumPrecise([])).toBe(-0)
    expect(sumPrecise([1e20, 1, -1e20])).toBe(1)
    expect(sumPrecise([Infinity, -Infinity])).toBeNaN()
    expect(() => sumPrecise([1, '2'] as unknown as number[])).toThrow(TypeError)
  })

  it('preserves an existing Math.sumPrecise implementation', () => {
    execFileSync(process.execPath, [
      '--input-type=module',
      '--eval',
      `
        const nativeSumPrecise = () => 42
        Object.defineProperty(Math, 'sumPrecise', {
          value: nativeSumPrecise,
          writable: true,
          configurable: true,
        })
        await import('./dist/pdfjs.mjs')
        if (Math.sumPrecise !== nativeSumPrecise) {
          throw new Error('The existing Math.sumPrecise implementation was replaced')
        }
      `,
    ], { cwd: process.cwd() })
  })

  it('can resolve a custom PDF.js version', async () => {
    // @ts-ignore: Dynamic import from package build.
    await definePDFJSModule(() => import('../dist/pdfjs'))
    const { text } = await extractText(await getPDF())

    expect(text[0]).toMatchInlineSnapshot('"Dummy PDF file"')
  })

  it('provides the PDF.js module', async () => {
    const PDFJS = await getResolvedPDFJS()
    const { version } = PDFJS

    expect(version).toMatchInlineSnapshot(`"6.1.200"`)
  })
})
