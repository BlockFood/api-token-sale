const { expect, assert } = require('chai')
const sinon = require('sinon')

const { getPublicHandler, getPrivateHandler } = require('./handler')

const expectFailure = async (promise, errorMessage, expectedError) => {
    let hasFailed
    try {
        await promise
        hasFailed = false
    } catch (e) {
        if (expectedError) {
            expect(e.toString()).to.equal(expectedError)
        }
        hasFailed = true
    }
    assert(hasFailed, errorMessage)
}

describe('handler', () => {
    const expectedPrivateId = 'privateId'
    const expectedPublicId = 'publicId'

    const getDb = () => ({
        add: sinon.stub(),
        update: sinon.stub(),
        get: sinon.stub(),
        getWithPublicId: sinon.stub(),
    })

    const getIdGenerator = () => ({
        generatePrivateId: sinon.stub(),
        generatePublicId: sinon.stub(),
    })
    const getEmailSender = () => ({
        sendFirstEmail: sinon.stub(),
        sendSecondEmail: sinon.stub(),
    })
    const getStorageHandler = () => ({
        store: sinon.stub()
    })

    describe('getPublicHandler', () => {
        describe('add', () => {
            it('should generate an ID, store the recording and send an email', async () => {
                const db = getDb()
                db.add.resolves()

                const idGenerator = getIdGenerator()
                idGenerator.generatePrivateId.returns(expectedPrivateId)
                idGenerator.generatePublicId.returns(expectedPublicId)

                const emailSender = getEmailSender()
                emailSender.sendFirstEmail.resolves()

                const { add } = getPublicHandler(db, idGenerator, emailSender, getStorageHandler())

                await add('foo@bar.baz')

                const dbFirstCall = db.add.getCall(0)
                const [newApplication] = dbFirstCall.args
                expect(newApplication).to.deep.equal({
                    email: 'foo@bar.baz',
                    privateId: expectedPrivateId,
                    publicId: expectedPublicId
                })

                const emailSenderFirstCall = emailSender.sendFirstEmail.getCall(0)
                const [email, privateId] = emailSenderFirstCall.args
                expect(email).to.equal('foo@bar.baz')
                expect(privateId).to.equal(expectedPrivateId)
            })
            it('should throw if email is invalid', async () => {
                const { add } = getPublicHandler(getDb(), getIdGenerator(), getEmailSender(), getStorageHandler())

                await expectFailure(
                    add('invalid-email'),
                    'Invalid email did not throw error',
                    'Error: invalid email'
                )
            })
        })
        describe('getMissingFieldsForUpdate', () => {
            it('should return the list of missing fields', () => {
                const { getMissingFieldsForUpdate } = getPublicHandler()

                const missingFields = getMissingFieldsForUpdate({})
                expect(missingFields).to.deep.equal([
                    'firstName',
                    'lastName',
                    'birthYear',
                    'birthMonth',
                    'birthDay',
                    'addressLine1',
                    'postalCode',
                    'city',
                    'country',
                    'nationality',
                ])

            })
        })
        describe('update', () => {
            const getValidApplication = () => ({
                firstName: 'foo',
                lastName: 'foo',
                birthYear: 'foo',
                birthMonth: 'foo',
                birthDay: 'foo',
                addressLine1: 'foo',
                addressLine2: 'foo',
                city: 'foo',
                state: 'foo',
                postalCode: 'foo',
                country: 'foo',
                nationality: 'foo',
            })

            it('should update the application and move the image', async () => {
                const db = getDb()
                db.update.resolves()
                const validApplication = getValidApplication()

                const storageHandler = getStorageHandler()
                storageHandler.store.resolves('foo/bar.png')

                const expectedApplication = Object.assign({ idCardPath: 'foo/bar.png' }, validApplication)

                const { update } = getPublicHandler(db, getIdGenerator(), getEmailSender(), storageHandler)

                await update(expectedPrivateId, 'foo@bar', validApplication, 'temp/path/to/image.png')

                const dbFirstCall = db.update.getCall(0)
                const [privateId, application] = dbFirstCall.args
                expect(privateId).to.equal(expectedPrivateId)
                expect(application).to.deep.equal(expectedApplication)
            })

            it('should throw if invalid application', async () => {
                const invalidApplication = {
                    firstName: 'foo',
                    // missing fields
                }

                const { update } = getPublicHandler(getDb(), getIdGenerator(), getEmailSender(), getStorageHandler())

                await expectFailure(
                    update(expectedPrivateId, 'foo@bar', invalidApplication, 'temp/path/to/image.png'),
                    'update did not fail as expected',
                    'Error: missing fields: lastName, birthYear, birthMonth, birthDay, addressLine1, postalCode, city, country, nationality'
                )
            })
            it('should throw if application is locked', async () => {
                const invalidApplication = {
                    isLocked: 'true',
                    // missing fields
                }

                const { update } = getPublicHandler(getDb(), getIdGenerator(), getEmailSender(), getStorageHandler())

                await expectFailure(
                    update(expectedPrivateId, 'foo@bar', invalidApplication, 'temp/path/to/image.png'),
                    'Get did not fail while returning locked application',
                    'Error: application is locked'
                )
            })
        })
        describe('get', () => {
            it('should return a cleaned version from the db', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves({
                    privateId: expectedPrivateId,
                    publicId: expectedPublicId,
                    email: 'foo@bar',
                    firstName: 'foo',
                    lastName: 'foo',
                    birthYear: 'foo',
                    birthMonth: 'foo',
                    birthDay: 'foo',
                    addressLine1: 'foo',
                    addressLine2: 'foo',
                    postalCode: 'foo',
                    city: 'foo',
                    state: 'foo',
                    country: 'foo',
                    nationality: 'foo',
                    idCardPath: 'foo/bar.png',
                    isLocked: true,
                    createdAt: new Date()
                })

                const { get } = getPublicHandler(db, getIdGenerator(), getEmailSender(), getStorageHandler())

                const returnedApplication = await get(expectedPrivateId)

                expect(returnedApplication).to.deep.equal({
                    privateId: expectedPrivateId,
                    publicId: expectedPublicId,
                    email: 'foo@bar',
                    firstName: 'foo',
                    lastName: 'foo',
                    birthYear: 'foo',
                    birthMonth: 'foo',
                    birthDay: 'foo',
                    addressLine1: 'foo',
                    addressLine2: 'foo',
                    postalCode: 'foo',
                    city: 'foo',
                    state: 'foo',
                    country: 'foo',
                    nationality: 'foo',
                    isLocked: true,
                })
            })
            it('should throw if application not found', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves(null)

                const { get } = getPublicHandler(db, getIdGenerator(), getEmailSender(), getStorageHandler())

                await expectFailure(
                    get(expectedPrivateId),
                    'Get did not fail while returning non existing application',
                    'Error: application not found'
                )
            })
        })

        describe('lock', () => {
            it('should lock the application', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves({
                    privateId: expectedPrivateId
                })
                const { lock } = getPublicHandler(db, getIdGenerator(), getEmailSender(), getStorageHandler())

                await lock(expectedPrivateId)

                const updateFirstCall = db.update.getCall(0)
                const [privateId, application] = updateFirstCall.args
                expect(privateId).to.equal(expectedPrivateId)
                expect(application).to.deep.equal({
                    privateId: expectedPrivateId,
                    isLocked: true
                })
            })

            it('should send second email', async() => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId
                })
                const emailSender = getEmailSender()
                emailSender.sendSecondEmail.resolves()

                const { lock } = getPublicHandler(db, getIdGenerator(), emailSender, getStorageHandler())

                await lock(expectedPrivateId)


                const emailSenderFirstCall = emailSender.sendSecondEmail.getCall(0)
                const [email, application] = emailSenderFirstCall.args
                expect(email).to.equal('foo@bar')
                expect(application).to.deep.equal({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    isLocked: true
                })

            })
            it('should throw if application not found', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves(null)

                const { lock } = getPublicHandler(db, getIdGenerator(), getEmailSender(), getStorageHandler())

                await expectFailure(
                    lock(expectedPrivateId),
                    'Get did not fail while returning non existing application',
                    'Error: application not found'
                )
            })
        })
    })

    describe('getPrivateHandler', () => {
        describe('get', () => {
            it('should returned an unfiltered version from the db', async () => {
                const db = getDb()
                const whatever = { whatevs: true }
                db.getWithPublicId.withArgs(expectedPublicId).resolves(whatever)

                const { get } = getPrivateHandler(db)

                const returnedApplication = await get(expectedPublicId)

                expect(returnedApplication).to.deep.equal(whatever)
            })
        })
    })
})
