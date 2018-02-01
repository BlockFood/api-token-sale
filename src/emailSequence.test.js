const { expect, assert } = require('chai')
const sinon = require('sinon')

const emailSequence = require('./emailSequence')

describe('emailSequence', () => {
    describe('sendFirstEmail', () => {
        it('calls send with some content', async () => {
            const send = sinon.stub()
            const getNextStepUrl = privateId => `url/to/pre-sale-form/${privateId}`

            await emailSequence(send, getNextStepUrl).sendFirstEmail('foo@bar', 'privateId')

            assert(send.calledOnce)

            const sendCall = send.getCall(0)
            const [email, sent] = sendCall.args

            expect(email).to.equal('foo@bar')

            expect(sent.title).to.equal('BlockFood - Next step for pre-sale')
            expect(sent.signature).to.equal('Best regards,<br><br>BlockFood team')
            expect(sent.content.length > 0).to.equal(true)
        })
    })

    describe('sendSecondEmail', () => {
        it('calls send with some content', async () => {
            const send = sinon.stub()
            const getNextStepUrl = privateId => `url/to/pre-sale-form/${privateId}`

            const application = {
                email: 'foo@bar',
                firstName: 'foo<p>bar</p>',
                lastName: 'bar',
                privateId: 'privateId'
            }
            const now = new Date('2018-02-07T14:30:00.000Z')

            await emailSequence(send, getNextStepUrl).sendSecondEmail('foo@bar', application, now)

            assert(send.calledOnce)

            const sendCall = send.getCall(0)
            const [email, sent] = sendCall.args


            expect(email).to.equal('foo@bar')

            expect(sent.title).to.equal('BlockFood - 1 day left for pre-sale')
            expect(sent.signature).to.equal('Best regards,<br><br>BlockFood team')
            expect(sent.content.length > 0).to.equal(true)
        })
    })

    describe('sendSuccessEmail', () => {
        it('calls send with some content', async () => {
            const send = sinon.stub()
            const getNextStepUrl = privateId => `url/to/pre-sale-form/${privateId}`

            const application = {
                email: 'foo@bar',
                firstName: 'foo<p>bar</p>',
                lastName: 'bar',
                privateId: 'privateId'
            }

            await emailSequence(send, getNextStepUrl).sendSuccessEmail('foo@bar', application)

            assert(send.calledOnce)

            const sendCall = send.getCall(0)
            const [email, sent] = sendCall.args

            expect(email).to.equal('foo@bar')

            expect(sent.title).to.equal('BlockFood - Your application has been accepted 🚀')
            expect(sent.signature).to.equal('Best regards,<br><br>BlockFood team')
            expect(sent.content.length > 0).to.equal(true)
        })
    })

    describe('sendFailureEmail', () => {
        it('calls send with some content', async () => {
            const send = sinon.stub()
            const getNextStepUrl = privateId => `url/to/pre-sale-form/${privateId}`

            const application = {
                email: 'foo@bar',
                firstName: 'foo<p>bar</p>',
                lastName: 'bar',
                privateId: 'privateId'
            }

            await emailSequence(send, getNextStepUrl).sendFailureEmail('foo@bar', application)

            assert(send.calledOnce)

            const sendCall = send.getCall(0)
            const [email, sent] = sendCall.args

            expect(email).to.equal('foo@bar')

            expect(sent.title).to.equal('BlockFood - Your application has been declined')
            expect(sent.signature).to.equal('Best regards,<br><br>BlockFood team')
            expect(sent.content.length > 0).to.equal(true)
        })
    })
})