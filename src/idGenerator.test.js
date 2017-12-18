const { expect, assert } = require('chai')
const sinon = require('sinon')

const { generatePrivateId, generatePublicId } = require('./idGenerator')

describe('idGenerator', () => {
    it('should generate random ids', () => {
        const privateId = generatePrivateId()
        const publicId = generatePublicId()

        assert(privateId.length >= 30)

        expect(privateId).not.to.equal(publicId)
    })
})