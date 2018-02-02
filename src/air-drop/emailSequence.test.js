const { expect, assert } = require('chai')
const sinon = require('sinon')

const emailSequence = require('./emailSequence')

describe('airDrop/emailSequence', () => {
    describe('sendFirstEmail', () => {
        it('BlockFood - Welcome to the BlockFood Air Drop Program', async () => {
            const send = sinon.stub()

            await emailSequence(send).sendFirstEmail('foo@bar', 'privateId')

            assert(send.calledOnce)

            const sendCall = send.getCall(0)
            const [email, sent] = sendCall.args

            expect(email).to.equal('foo@bar')

            expect(sent.title).to.equal('BlockFood - Welcome to the BlockFood Air Drop Program')
            expect(sent.signature).to.equal('Best regards,<br><br>BlockFood team')
            expect(sent.content.length > 0).to.equal(true)
        })
    })
})