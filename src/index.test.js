const { expect, assert } = require('chai')
const sinon = require('sinon')
const supertest = require('supertest')

const fs = require('fs')

const { start, getPublicApp, getPrivateApp } = require('./index')

describe('index', () => {

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
        })

        describe('POST /pre-sale/edit/:privateId', () => {
            it('should call handlers.update with valid parameters', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.withArgs('ID42').resolves({ email: 'foo@bar' })
                const expectedPreSaleApplication = {
                    name: 'what'
                }
                const app = getPublicApp(handler)

                await supertest(app)
                    .post('/pre-sale/edit/ID42')
                    .field('name', 'what')
                    .attach('id_card', 'test/fixture/logo.png')
                    .expect(200)

                const [firstCall] = handler.update.getCalls()

                const [id, email, application, idCardPath] = firstCall.args
                expect(id).to.equal('ID42')
                expect(email).to.equal('foo@bar')
                expect(application).to.deep.equal(expectedPreSaleApplication)

                assert(fs.existsSync(idCardPath))
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