const { expect, assert } = require('chai')
const sinon = require('sinon')

const MongoInMemory = require('mongo-in-memory')

const db = require('./db')

const mongoServerInstance = new MongoInMemory(23333)

const getDbUri = async () => new Promise((resolve, reject) => {
    mongoServerInstance.start((error, config) =>
        error ? reject(error) : resolve(mongoServerInstance.getMongouri('whatevs'))
    )
})

const stopDbInstance = async () => new Promise((resolve, reject) =>
    mongoServerInstance.stop(error => error ? reject(error) : resolve())
)

describe('db', () => {
    let dbUri, dbHandler
    before(async () => {
        dbUri = await getDbUri()
    })
    after(async () => {
        stopDbInstance()
    })
    beforeEach(async () => {
        dbHandler = await db(dbUri, 'pre-sale-test-' + ~~(Math.random()*100000))
    })
    afterEach(async () => {
        dbHandler && dbHandler.close()
    })

    describe('add', () => {
        it('should add the application in the db', async () => {
            await dbHandler.add({ email: 'foo@bar', privateId: 'privateId', publicId: 'publicId' })

            const application = await dbHandler.get('privateId')

            expect(application.email).to.equal('foo@bar')
            expect(application.privateId).to.equal('privateId')
            expect(application.publicId).to.equal('publicId')
        })
    })

    describe('update', () => {
        it('should update the application in the db', async () => {
            await dbHandler.add({ email: 'foo@bar', privateId: 'privateId', publicId: 'publicId' })

            await dbHandler.update('privateId', { newField: true })

            const application = await dbHandler.get('privateId')

            expect(application.email).to.equal('foo@bar')
            expect(application.privateId).to.equal('privateId')
            expect(application.publicId).to.equal('publicId')
            expect(application.newField).to.equal(true)
        })
    })

    describe('get', () => {
        it('should return null if no value found', async () => {
            const applicationNotFound = await dbHandler.get('not-existing-id')

            expect(applicationNotFound).to.be.null
        })
    })

    describe('getWithPublicId', () => {
        it('returns the application with the given publicId', async () => {
            await dbHandler.add({ email: 'foo@bar', privateId: 'privateId', publicId: 'publicId' })

            const application = await dbHandler.getWithPublicId('publicId')

            expect(application.email).to.equal('foo@bar')
            expect(application.privateId).to.equal('privateId')
            expect(application.publicId).to.equal('publicId')
        })
    })

    describe('getAll', () => {
        it('returns all applications', async () => {
            await dbHandler.add({ email: 'foo@bar', privateId: 'privateId', publicId: 'publicId' })

            const applications = await dbHandler.getAll()

            expect(applications.length).to.equal(1)

            const firstApplication = applications[0]

            expect(firstApplication.email).to.equal('foo@bar')
            expect(firstApplication.privateId).to.equal('privateId')
            expect(firstApplication.publicId).to.equal('publicId')
        })
    })
})
