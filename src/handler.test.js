const { expect, assert } = require('chai')
const sinon = require('sinon')

const { getPublicHandler, getPrivateHandler} = require('./handler')

describe('handler', () => {
    const privateId = 'privateId'
    const publicId = 'publicId'

    const getDb = () => ({
        add: sinon.stub()
    })

    const getIdGenerator = () => ({
        generatePrivateId: sinon.stub(),
        generatePublicId: sinon.stub()
    })
    const getEmailSender = () => ({
        sendFirstEmail: sinon.stub()
    })

    describe('getPublicHandler', () => {
        describe('add', () => {
            it('should generate an ID, store the recording and send an email', async() => {
                const db = getDb()
                db.add.resolves()

                const idGenerator = getIdGenerator()
                idGenerator.generatePrivateId.returns(privateId)
                idGenerator.generatePublicId.returns(publicId)

                const emailSender = getEmailSender()
                emailSender.sendFirstEmail.resolves()

                const { add } = getPublicHandler(db, idGenerator, emailSender)

                await add('foo@bar')

                const dbFirstCall = db.add.getCall(0)
                const [ newApplication ] = dbFirstCall.args
                expect(newApplication).to.deep.equal({
                    email: 'foo@bar',
                    privateId,
                    publicId
                })

                const emailSenderFirstCall = emailSender.sendFirstEmail.getCall(0)
                const [ email, emailPrivateId ] = emailSenderFirstCall.args
                expect(email).to.equal('foo@bar')
                expect(emailPrivateId).to.equal(privateId)
            })
        })
        describe('update', () => {

        })
        describe('get', () => {

        })
    })

    describe('getPrivateHandler', () => {
        describe('get', () => {

        })
    })
})