/* eslint-disable ts/ban-ts-comment */
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
