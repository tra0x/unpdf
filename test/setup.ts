/* eslint-disable ts/ban-ts-comment */
import type { MockInstance } from 'vitest'
import { afterEach, beforeAll, beforeEach, expect, vi } from 'vitest'
import { definePDFJSModule } from '../src/index'

// PDF.js catches a missing runtime API and reports it through `warn` rather
// than letting it surface, so a forgotten polyfill degrades output silently –
// font repair, for instance, falls back to a substitute font. Only that class
// of message fails a test; PDF.js warns about malformed documents as a matter
// of course.
const MISSING_API_PATTERN = /is not a function|is not defined|is not a constructor/

let consoleWarnSpy: MockInstance<typeof console.warn>

// Tests run with `isolate: false`, so the resolved PDF.js module persists
// across files – re-define it per file to keep them order-independent.
beforeAll(async () => {
  // @ts-ignore: Dynamic import from package build.
  await definePDFJSModule(() => import('../dist/pdfjs'))
})

beforeEach(() => {
  consoleWarnSpy = vi.spyOn(console, 'warn')
})

afterEach(() => {
  const missingAPIWarnings = consoleWarnSpy.mock.calls
    .map(call => call.join(' '))
    .filter(message => MISSING_API_PATTERN.test(message))

  consoleWarnSpy.mockRestore()
  expect(missingAPIWarnings).toEqual([])
})
