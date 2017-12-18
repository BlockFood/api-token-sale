const { expect, assert } = require('chai')
const sinon = require('sinon')

const emailSender = require('./emailSender')

describe('emailSender', () => {
    const fakeTemplate = `
    <p>{{{title}}}</p>
    <p>{{{content}}}</p>
    <p>{{{signature}}}</p>
    `
    describe('send', () => {
        it('should call transporter.sendMail', async () => {
            const transporter = {
                sendMail: sinon.stub()
            }

            await emailSender(transporter, fakeTemplate).send('foo@bar', {
                title: 'foo',
                content: 'bar',
                signature: 'baz'
            })

            assert(transporter.sendMail.calledOnce)

            const [params] = transporter.sendMail.getCall(0).args

            expect(params.from).to.equal('no-reply@blockfood.io')
            expect(params.to).to.equal('foo@bar')
            expect(params.subject).to.equal('foo')
            expect(params.html).to.equal('<p>foo</p><p>bar</p><p>baz</p>')
        })
    })
})