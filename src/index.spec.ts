import { sum } from './index'
import { expect } from 'chai'

describe('sum()', () => {
  it('should sum', () => {
    expect(sum(1, 3)).to.equal(4)
  })
})
