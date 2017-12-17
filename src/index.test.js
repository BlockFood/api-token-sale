const { expect } = require('chai')

const index = require('./index')

describe('index', () => {
    it('should be defined', () => {
        expect(index).not.to.be.null
    })
})