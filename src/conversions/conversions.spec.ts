import * as assert from 'node:assert/strict'
import { convertFromMmToPx, convertFromPxToMm } from './conversions'

describe('conversions', () => {
  describe('convertFromMmToPx', () => {
    it('should convert millimeters to pixels correctly', () => {
      assert.strictEqual(convertFromMmToPx(10, 300), 118)
      assert.strictEqual(convertFromMmToPx(25.4, 300), 300)
      assert.strictEqual(convertFromMmToPx(0, 300), 0)
      assert.strictEqual(convertFromMmToPx(10, 0), 0)
      assert.strictEqual(convertFromMmToPx(-10, 300), 0)
      assert.strictEqual(convertFromMmToPx(10, -300), 0)
    })
  })

  describe('convertFromPxToMm', () => {
    it('should convert pixels to millimeters correctly', () => {
      assert.strictEqual(convertFromPxToMm(300, 300), 25)
      assert.strictEqual(convertFromPxToMm(118, 300), 10)
      assert.strictEqual(convertFromPxToMm(0, 300), 0)
      assert.strictEqual(convertFromPxToMm(300, 0), 0)
      assert.strictEqual(convertFromPxToMm(-300, 300), 0)
      assert.strictEqual(convertFromPxToMm(300, -300), 0)
    })
  })
})
