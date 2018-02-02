const {expect, assert} = require('chai')
const sinon = require('sinon')

const {getPublicHandler, getPrivateHandler} = require('./handler')

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

describe.skip('airDropHandler', () => {
    const expectedPrivateId = 'privateId'
    const expectedPublicId = 'publicId'

    const getDb = () => ({
        add: sinon.stub(),
        update: sinon.stub(),
        get: sinon.stub(),
        getWithPublicId: sinon.stub(),
        getAll: sinon.stub(),
    })

    const getIdGenerator = () => ({
        generatePrivateId: sinon.stub(),
        generatePublicId: sinon.stub(),
    })
    const getEmailSender = () => ({
        sendFirstEmail: sinon.stub(),
        sendSecondEmail: sinon.stub(),
        sendSuccessEmail: sinon.stub(),
        sendFailureEmail: sinon.stub(),
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

                const {add} = getPublicHandler(db, idGenerator, emailSender)

                const now = new Date()

                await add('foo@bar.baz', 'sponsor_id', now)

                const dbFirstCall = db.add.getCall(0)
                const [newApplication] = dbFirstCall.args
                expect(newApplication).to.deep.equal({
                    email: 'foo@bar.baz',
                    privateId: expectedPrivateId,
                    publicId: expectedPublicId,
                    sponsor: 'sponsor_id',
                    creation: now
                })

                const emailSenderFirstCall = emailSender.sendFirstEmail.getCall(0)
                const [email, privateId, publicId] = emailSenderFirstCall.args
                expect(email).to.equal('foo@bar.baz')
                expect(privateId).to.equal(expectedPrivateId)
                expect(publicId).to.equal(expectedPublicId)
            })
            it('should throw if email is invalid', async () => {
                const {add} = getPublicHandler(getDb(), getIdGenerator(), getEmailSender())

                await expectFailure(
                    add('invalid-email'),
                    'Invalid email did not throw error',
                    'Error: invalid email'
                )
            })
        })
        describe('getMissingFieldsForUpdate', () => {
            it('should return the list of missing fields', () => {
                const {getMissingFieldsForUpdate} = getPublicHandler()

                const missingFields = getMissingFieldsForUpdate({})
                expect(missingFields).to.deep.equal([
                    'firstName',
                    'lastName',
                    'country',
                ])

            })
        })
        describe('update', () => {
            const getValidApplication = () => ({
                firstName: 'foo',
                lastName: 'foo',
                country: 'foo',
            })

            it('should update the application', async () => {
                const db = getDb()
                db.update.resolves()
                const validApplication = getValidApplication()

                const now = new Date()
                const expectedApplication = Object.assign({
                    lastUpdate: now
                }, validApplication)

                const {update} = getPublicHandler(db, getIdGenerator(), getEmailSender())

                await update(expectedPrivateId, validApplication, true, now)

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

                const {update} = getPublicHandler(getDb(), getIdGenerator(), getEmailSender())

                await expectFailure(
                    update(expectedPrivateId, invalidApplication),
                    'update did not fail as expected',
                    'Error: missing fields: lastName, country'
                )
            })
            it('should work if invalid application with validate=false', async () => {
                const invalidApplication = {
                    txHashes: ['txHash']
                }

                const {update} = getPublicHandler(getDb(), getIdGenerator(), getEmailSender())

                await update(expectedPrivateId, invalidApplication, false)
            })
            it('should throw if application is locked', async () => {
                const invalidApplication = {
                    isLocked: 'true',
                    // missing fields
                }

                const {update} = getPublicHandler(getDb(), getIdGenerator(), getEmailSender())

                await expectFailure(
                    update(expectedPrivateId, invalidApplication),
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
                    country: 'foo',
                    sponsor: 'sponsor_id',
                    txHashes: [],
                    isLocked: true,
                    createdAt: new Date()
                })

                const {get} = getPublicHandler(db, getIdGenerator(), getEmailSender())

                const returnedApplication = await get(expectedPrivateId)

                expect(returnedApplication).to.deep.equal({
                    privateId: expectedPrivateId,
                    publicId: expectedPublicId,
                    email: 'foo@bar',
                    firstName: 'foo',
                    lastName: 'foo',
                    country: 'foo',
                    sponsor: 'sponsor_id',
                    txHashes: [],
                    isLocked: true,
                })
            })
            it('should throw if application not found', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves(null)

                const {get} = getPublicHandler(db, getIdGenerator(), getEmailSender())

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
                const {lock} = getPublicHandler(db, getIdGenerator(), getEmailSender())

                const now = new Date()

                await lock(expectedPrivateId, now)

                const updateFirstCall = db.update.getCall(0)
                const [privateId, application] = updateFirstCall.args
                expect(privateId).to.equal(expectedPrivateId)
                expect(application).to.deep.equal({
                    privateId: expectedPrivateId,
                    lockDate: now,
                    isLocked: true
                })
            })
            /*
                        it('should send second email', async () => {
                            const db = getDb()
                            db.get.withArgs(expectedPrivateId).resolves({
                                email: 'foo@bar',
                                privateId: expectedPrivateId
                            })
                            const emailSender = getEmailSender()
                            emailSender.sendSecondEmail.resolves()

                            const { lock } = getPublicHandler(db, getIdGenerator(), emailSender)

                            const now = new Date()

                            await lock(expectedPrivateId, now)

                            const emailSenderFirstCall = emailSender.sendSecondEmail.getCall(0)
                            const [email, application] = emailSenderFirstCall.args
                            expect(email).to.equal('foo@bar')
                            expect(application).to.deep.equal({
                                email: 'foo@bar',
                                privateId: expectedPrivateId,
                                lockDate: now,
                                isLocked: true
                            })

                        })*/
            it('should throw if application not found', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves(null)

                const {lock} = getPublicHandler(db, getIdGenerator(), getEmailSender())

                await expectFailure(
                    lock(expectedPrivateId),
                    'Get did not fail while returning non existing application',
                    'Error: application not found'
                )
            })
        })

        describe('getReferrents', () => {
            it('should return the referrents corresponding to the public id', async () => {
                const db = getDb()
                db.getAll.resolves([
                    {sponsor: 'A'}, {sponsor: 'B'}, {sponsor: 'C'}, {sponsor: 'A'}
                ])

                const {getReferrents} = getPublicHandler(db, getIdGenerator(), getEmailSender())

                const referrents = await getReferrents('A')

                expect(referrents).to.deep.equal([{sponsor: 'A'}, {sponsor: 'A'}])
            })
            it('should return an empty array if no applications match', async () => {
                const db = getDb()
                db.getAll.resolves([])

                const {getReferrents} = getPublicHandler(db, getIdGenerator(), getEmailSender())

                const referrents = await getReferrents('B')

                expect(referrents).to.deep.equal([])
            })
        })
    })

    describe('getPrivateHandler', () => {
        describe('get', () => {
            it('should returned an unfiltered version from the db', async () => {
                const db = getDb()
                const whatever = {whatevs: true}
                db.getWithPublicId.withArgs(expectedPublicId).resolves(whatever)

                const {get} = getPrivateHandler(db)

                const returnedApplication = await get(expectedPublicId)

                expect(returnedApplication).to.deep.equal(whatever)
            })
        })

        describe('getAll', () => {
            it('should return the list of all applications', async () => {
                const db = getDb()
                const whatever = {whatevs: true}
                db.getAll.resolves(whatever)

                const {getAll} = getPrivateHandler(db)

                const returnedApplications = await getAll()

                expect(returnedApplications).to.deep.equal(whatever)
            })
        })

        describe('sendReminder', () => {
            it('should send second email', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId
                })
                const emailSender = getEmailSender()
                emailSender.sendSecondEmail.resolves()

                const {sendReminder} = getPrivateHandler(db, emailSender)

                const now = new Date()

                await sendReminder(expectedPrivateId, now)

                const emailSenderFirstCall = emailSender.sendSecondEmail.getCall(0)
                const [email, application] = emailSenderFirstCall.args
                expect(email).to.equal('foo@bar')
                expect(application).to.deep.equal({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    reminderDate: now
                })
            })
            it('should send second email only once', async () => {
                const now = new Date()

                const db = getDb()
                db.get.withArgs(expectedPrivateId)
                    .onCall(0).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId
                }).onCall(1).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    reminderDate: now
                })
                const emailSender = getEmailSender()
                emailSender.sendSecondEmail.resolves()

                const {sendReminder} = getPrivateHandler(db, emailSender)

                await sendReminder(expectedPrivateId, now)
                await sendReminder(expectedPrivateId, now)

                expect(emailSender.sendSecondEmail.calledOnce).to.equal(true)
            })
            it('should update the application to add the reminder date', async () => {
                const now = new Date()

                const db = getDb()
                db.get.withArgs(expectedPrivateId)
                    .onCall(0).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId
                })
                db.update.resolves()

                const expectedUpdatedApplication = {
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    reminderDate: now
                }

                const emailSender = getEmailSender()
                emailSender.sendSecondEmail.resolves()

                const {sendReminder} = getPrivateHandler(db, emailSender)

                await sendReminder(expectedPrivateId, now)

                expect(db.update.getCall(0).args).to.deep.equal([
                    expectedPrivateId,
                    expectedUpdatedApplication
                ])
            })
            it('should throw if application not find', async () => {
                const now = new Date()

                const db = getDb()
                db.get.withArgs(expectedPrivateId)
                    .resolves(null)

                const {sendReminder} = getPrivateHandler(db)

                await expectFailure(
                    sendReminder(expectedPrivateId, now),
                    'sendReminder did not fail',
                    'Error: application not found'
                )
            })
        })

        describe('accept', () => {
            it('should send an email', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId
                })
                const emailSender = getEmailSender()
                emailSender.sendSuccessEmail.resolves()

                const {accept} = getPrivateHandler(db, emailSender)

                const now = new Date()

                await accept(expectedPrivateId, now)

                const emailSenderFirstCall = emailSender.sendSuccessEmail.getCall(0)
                const [email, application] = emailSenderFirstCall.args
                expect(email).to.equal('foo@bar')
                expect(application).to.deep.equal({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    acceptDate: now
                })
            })
            it('should send an email once', async () => {
                const now = new Date()

                const db = getDb()
                db.get.withArgs(expectedPrivateId)
                    .onCall(0).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId
                }).onCall(1).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    acceptDate: now
                })
                const emailSender = getEmailSender()
                emailSender.sendSuccessEmail.resolves()

                const {accept} = getPrivateHandler(db, emailSender)

                await accept(expectedPrivateId, now)
                await accept(expectedPrivateId, now)

                expect(emailSender.sendSuccessEmail.calledOnce).to.equal(true)
            })
            it('should throw if application already got rejected', async () => {
                const now = new Date()

                const db = getDb()
                db.get.withArgs(expectedPrivateId)
                    .onCall(0).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    rejectDate: new Date()
                })
                const emailSender = getEmailSender()
                emailSender.sendSuccessEmail.resolves()

                const {accept} = getPrivateHandler(db, emailSender)

                await expectFailure(
                    accept(expectedPrivateId, now),
                    'accept did not throw even though application was rejected'
                )
            })
        })

        describe('reject', () => {
            it('should send an email', async () => {
                const db = getDb()
                db.get.withArgs(expectedPrivateId).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId
                })
                const emailSender = getEmailSender()
                emailSender.sendFailureEmail.resolves()

                const {reject} = getPrivateHandler(db, emailSender)

                const now = new Date()

                await reject(expectedPrivateId, now)

                const emailSenderFirstCall = emailSender.sendFailureEmail.getCall(0)
                const [email, application] = emailSenderFirstCall.args
                expect(email).to.equal('foo@bar')
                expect(application).to.deep.equal({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    rejectDate: now
                })
            })
            it('should send an email once', async () => {
                const now = new Date()

                const db = getDb()
                db.get.withArgs(expectedPrivateId)
                    .onCall(0).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId
                }).onCall(1).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    rejectDate: now
                })
                const emailSender = getEmailSender()
                emailSender.sendFailureEmail.resolves()

                const {reject} = getPrivateHandler(db, emailSender)

                await reject(expectedPrivateId, now)
                await reject(expectedPrivateId, now)

                expect(emailSender.sendFailureEmail.calledOnce).to.equal(true)
            })
            it('should throw if application already got accepted', async () => {
                const now = new Date()

                const db = getDb()
                db.get.withArgs(expectedPrivateId)
                    .onCall(0).resolves({
                    email: 'foo@bar',
                    privateId: expectedPrivateId,
                    acceptDate: new Date()
                })
                const emailSender = getEmailSender()
                emailSender.sendFailureEmail.resolves()

                const {reject} = getPrivateHandler(db, emailSender)

                await expectFailure(
                    reject(expectedPrivateId, now),
                    'accept did not throw even though application was accepted'
                )
            })
        })
    })
})
