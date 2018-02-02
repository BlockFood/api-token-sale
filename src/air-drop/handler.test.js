const {expect, assert} = require('chai')
const sinon = require('sinon')

const airDropHandler = require('./handler')

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

describe('airDropHandler', () => {
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
    })

    describe('add', () => {
        it('should generate an ID, store the recording and send an email', async () => {
            const db = getDb()
            db.add.resolves()

            const idGenerator = getIdGenerator()
            idGenerator.generatePrivateId.returns(expectedPrivateId)
            idGenerator.generatePublicId.returns(expectedPublicId)

            const emailSender = getEmailSender()
            emailSender.sendFirstEmail.resolves()

            const {add} = airDropHandler(db, idGenerator, emailSender)

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
            const {add} = airDropHandler(getDb(), getIdGenerator(), getEmailSender())

            await expectFailure(
                add('invalid-email'),
                'Invalid email did not throw error',
                'Error: invalid email'
            )
        })
    })
    describe('getMissingFieldsForUpdate', () => {
        it('should return the list of missing fields', () => {
            const {getMissingFieldsForUpdate} = airDropHandler()

            const missingFields = getMissingFieldsForUpdate({})
            expect(missingFields).to.deep.equal([
                'ethAddress',
                'sponsor',
            ])

        })
    })
    describe('update', () => {
        const getValidApplication = () => ({
            ethAddress: '0x02949300294930029493002949304930',
            sponsor: 'existing_sponsor'
        })

        it('should update the application', async () => {
            const db = getDb()
            db.update.resolves()
            const validApplication = getValidApplication()

            const now = new Date()
            const expectedApplication = Object.assign({
                lastUpdate: now
            }, validApplication)

            const {update} = airDropHandler(db, getIdGenerator(), getEmailSender())

            await update(expectedPrivateId, validApplication, true, now)

            const dbFirstCall = db.update.getCall(0)
            const [privateId, application] = dbFirstCall.args
            expect(privateId).to.equal(expectedPrivateId)
            expect(application).to.deep.equal(expectedApplication)
        })

        it('should throw if invalid application', async () => {
            const invalidApplication = {
                ethAddress: 'foo',
                // missing fields
            }

            const {update} = airDropHandler(getDb(), getIdGenerator(), getEmailSender())

            await expectFailure(
                update(expectedPrivateId, invalidApplication),
                'update did not fail as expected',
                'Error: missing fields: sponsor'
            )
        })
        it('should work if invalid application with validate=false', async () => {
            const invalidApplication = {
                whatever: 'whatevs'
            }

            const {update} = airDropHandler(getDb(), getIdGenerator(), getEmailSender())

            await update(expectedPrivateId, invalidApplication, false)
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
                ethAddress: '0x42',
                sponsor: 'sponsor_id',
                createdAt: new Date()
            })

            const {get} = airDropHandler(db, getIdGenerator(), getEmailSender())

            const returnedApplication = await get(expectedPrivateId)

            expect(returnedApplication).to.deep.equal({
                privateId: expectedPrivateId,
                publicId: expectedPublicId,
                email: 'foo@bar',
                ethAddress: '0x42',
                sponsor: 'sponsor_id',
            })
        })
        it('should throw if application not found', async () => {
            const db = getDb()
            db.get.withArgs(expectedPrivateId).resolves(null)

            const {get} = airDropHandler(db, getIdGenerator(), getEmailSender())

            await expectFailure(
                get(expectedPrivateId),
                'Get did not fail while returning non existing application',
                'Error: application not found'
            )
        })
    })


    describe('getReferrents', () => {
        it('should return the referrents corresponding to the public id', async () => {
            const db = getDb()
            db.getAll.resolves([

                {
                    publicId: 'A'
                },
                {
                    publicId: 'B',
                    sponsor: 'A'
                },
                {
                    publicId: 'C',
                    sponsor: 'A'
                },
                {
                    publicId: 'D',
                    sponsor: 'B'
                }
            ])

            const {getReferrents} = airDropHandler(db, getIdGenerator(), getEmailSender())

            const referrents = await getReferrents('A')

            expect(referrents).to.deep.equal(
                {
                    publicId: 'A',
                    referrents: [
                        {
                            publicId: 'B',
                            sponsor: 'A',
                            referrents: [
                                {
                                    publicId: 'D',
                                    sponsor: 'B',
                                    referrents: []
                                }
                            ]
                        },
                        {
                            publicId: 'C',
                            sponsor: 'A',
                            referrents: []
                        }
                    ]
                }
            )
        })
        it('should return an empty array if no applications match', async () => {
            const db = getDb()
            db.getAll.resolves([{publicId: 'A'}])

            const {getReferrents} = airDropHandler(db, getIdGenerator(), getEmailSender())

            const referrents = await getReferrents('A')

            expect(referrents).to.deep.equal({
                publicId: 'A',
                referrents: []
            })
        })
    })
})
