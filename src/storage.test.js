const { expect, assert } = require('chai')
const sinon = require('sinon')
const supertest = require('supertest')

const path = require('path')
const fs = require('fs-extra-promise')

const storage = require('./storage')

describe('storage', () => {

    describe('store', () => {
        const testStoragePath = 'tmp/test/'

        after(async () => {
            await fs.removeAsync(testStoragePath)
        })

        it('should move the file to destination and return new path', async () => {

            const returnedPath = await storage(testStoragePath).store(path.join(__dirname, '..', 'test/fixture/logo.png'))

            assert(fs.existsSync(path.join(testStoragePath, returnedPath)))
        })
    })

})