import { expect } from 'chai'
import { convertFromMmToPx, convertFromPxToMm } from './conversions'

describe('conversions', () => {
  describe('convertFromMmToPx', () => {
    it('should convert millimeters to pixels correctly', () => {
      expect(convertFromMmToPx(10, 300)).to.equal(118)
      expect(convertFromMmToPx(25.4, 300)).to.equal(300)
      expect(convertFromMmToPx(0, 300)).to.equal(0)
      expect(convertFromMmToPx(10, 0)).to.equal(0)
      expect(convertFromMmToPx(-10, 300)).to.equal(0)
      expect(convertFromMmToPx(10, -300)).to.equal(0)
    })
  })

  describe('convertFromPxToMm', () => {
    it('should convert pixels to millimeters correctly', () => {
      expect(convertFromPxToMm(300, 300)).to.equal(25)
      expect(convertFromPxToMm(118, 300)).to.equal(10)
      expect(convertFromPxToMm(0, 300)).to.equal(0)
      expect(convertFromPxToMm(300, 0)).to.equal(0)
      expect(convertFromPxToMm(-300, 300)).to.equal(0)
      expect(convertFromPxToMm(300, -300)).to.equal(0)
    })
  })
})
