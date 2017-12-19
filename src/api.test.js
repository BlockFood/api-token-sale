const { expect, assert } = require('chai')
const sinon = require('sinon')
const supertest = require('supertest')

const fs = require('fs')

const { start, getPublicApp, getPrivateApp } = require('./api')

describe('api', () => {

    describe('start', () => {
        it('shoud call listen on app', () => {
            const app = {
                listen: sinon.stub()
            }

            start(app, 1337)

            assert(app.listen.calledWith(1337))
        })
    })

    describe('getPublicApp', () => {
        describe('GET /pre-sale/new', () => {
            it('should accept new applications', async () => {
                const app = getPublicApp()

                await supertest(app)
                    .get('/pre-sale/new?email=test@foo.bar')
                    .expect(200)
            })
            it('should call handlers.add', async () => {
                const handler = {
                    add: sinon.stub()
                }
                const app = getPublicApp(handler)

                await supertest(app)
                    .get('/pre-sale/new?email=test@foo.bar')
                    .expect(200)

                assert(handler.add.calledWith('test@foo.bar'))
            })
            it('should throw if handler throws', async () => {
                const handler = {
                    add: sinon.stub()
                }
                handler.add.rejects(new Error('Invalid application, missing fields : a,b,c'))
                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .get('/pre-sale/new?email=invalid')
                    .expect(500)

                expect(response.body.error).to.equal('Error: Invalid application, missing fields : a,b,c')
            })
        })

        describe('POST /pre-sale/edit/:privateId', () => {
            it('should call handlers.update with valid parameters', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.withArgs('ID42').resolves({ email: 'foo@bar' })
                const expectedPreSaleApplication = {
                    firstName: 'what',
                    lastName: 'what',
                    dateOfBirth: 'what',
                    address: 'what',
                    postalCode: 'what',
                    city: 'what',
                    country: 'what',
                    nationality: 'what',
                }
                const app = getPublicApp(handler)

                await supertest(app)
                    .post('/pre-sale/edit/ID42')
                    .field('firstName', 'what')
                    .field('lastName', 'what')
                    .field('dateOfBirth', 'what')
                    .field('address', 'what')
                    .field('postalCode', 'what')
                    .field('city', 'what')
                    .field('country', 'what')
                    .field('nationality', 'what')
                    .attach('id_card', 'test/fixture/logo.png')
                    .expect(200)

                const [firstCall] = handler.update.getCalls()

                const [id, email, application, idCardPath] = firstCall.args
                expect(id).to.equal('ID42')
                expect(email).to.equal('foo@bar')
                expect(application).to.deep.equal(expectedPreSaleApplication)

                assert(fs.existsSync(idCardPath))
            })

            it('should throw if handler throws', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.resolves({email: 'foo@bar'})
                handler.update.rejects(new Error('missing fields'))

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .post('/pre-sale/edit/ID42')
                    .field('nationality', 'what')
                    .attach('id_card', 'test/fixture/logo.png')
                    .expect(500)

                expect(response.body.error).to.equal('Error: missing fields')
            })

            it('should throw if handler throws', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.rejects(new Error('cannot find application'))
                handler.update.rejects(new Error('missing fields'))

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .post('/pre-sale/edit/ID42')
                    .field('nationality', 'what')
                    .attach('id_card', 'test/fixture/logo.png')
                    .expect(500)

                expect(response.body.error).to.equal('Error: cannot find application')
            })

        })

        describe('GET /pre-sale/review/:privateId', () => {
            it('should return whatever handlers.get returns', async () => {
                const handler = {
                    get: sinon.stub()
                }
                const whatever = { whatevs: true }
                handler.get.withArgs('ID42').resolves(whatever)

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .get('/pre-sale/review/ID42')
                    .expect(200)

                expect(response.body).to.deep.equal(whatever)
            })
            it('should throw if handlers.get throws', async () => {
                const handler = {
                    get: sinon.stub()
                }
                handler.get.rejects(new Error('application not found'))

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .get('/pre-sale/review/ID42')
                    .expect(500)

                expect(response.body.error).to.equal('Error: application not found')
            })
        })

    })

    describe('getPrivateApp', () => {
        describe('GET /admin/pre-sale/review/:publicId', () => {
            it('should return whatever handlers.get returns', async () => {
                const handler = {
                    get: sinon.stub()
                }
                const whatever = { whatevs: true }
                handler.get.withArgs('publicId').resolves(whatever)

                const app = getPrivateApp(handler)

                const response = await supertest(app)
                    .get('/admin/pre-sale/review/publicId')
                    .expect(200)

                expect(response.body).to.deep.equal(whatever)
            })
        })
    })
})
