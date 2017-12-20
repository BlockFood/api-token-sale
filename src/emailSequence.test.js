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
            expect(sent.content).to.equal(`<p>Thank you very much for applying to the pre-sale process.</p>
                    <p>In order to finalize your application, you must complete the following form:</p>
                    <p class='call-to-action-container'><a href='url/to/pre-sale-form/privateId' class='call-to-action'>Next step</a></p>`)
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

            await emailSequence(send, getNextStepUrl).sendSecondEmail('foo@bar', application)

            assert(send.calledOnce)

            const sendCall = send.getCall(0)
            const [email, sent] = sendCall.args

            expect(email).to.equal('foo@bar')

            expect(sent.title).to.equal('BlockFood - One final step for pre-sale')
            expect(sent.signature).to.equal('Best regards,<br><br>BlockFood team')
            expect(sent.content).to.equal(`<p>Dear foo&lt;p&gt;bar&lt;/p&gt;, thank you for submitting your documents.</p>
                    <p>If you did not already use the smart contract to finalize your application, follow this link:</p>
                    <p class='call-to-action-container'><a href='url/to/pre-sale-form/privateId' class='call-to-action'>Finalize application</a></p>
                    <p>Once your application is finalized, the BlockFood team will review your information and accept your participation if everything is okay. You should receive a confirmation email in the next 24 hours.</p>
                    <p>Thanks again for being awesome.</p>`)
        })
    })
})