const { expect, assert } = require('chai')
const sinon = require('sinon')
const supertest = require('supertest')

const fs = require('fs')

const { start, getApp } = require('./index')

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

    describe('getApp', () => {
        it('should return an express app', () => {
            const app = getApp()

            expect(app).not.to.be.null
            expect(app.listen).not.to.be.null
        })

        describe('GET /pre-sale/new', () => {
            it('should accept new applications', async () => {
                const app = getApp()

                await supertest(app)
                    .get('/pre-sale/new?email=test@foo.bar')
                    .expect(200)
            })
            it('should call handlers.add', async () => {
                const handler = {
                    add: sinon.stub()
                }
                const app = getApp(handler)

                await supertest(app)
                    .get('/pre-sale/new?email=test@foo.bar')
                    .expect(200)

                assert(handler.add.calledWith('test@foo.bar'))
            })
        })

        describe('POST /pre-sale/edit/:publicId', () => {
            it('should call handlers.update with valid parameters', async() => {
                const handler = {
                    update: sinon.stub()
                }
                const expectedPreSaleApplication = {
                    name : 'what'
                }
                const app = getApp(handler)

                await supertest(app)
                    .post('/pre-sale/edit/ID42')
                    .field('name', 'what')
                    .attach('id_card', 'test/fixture/logo.png')
                    .expect(200)

                const [ firstCall ] = handler.update.getCalls()

                const [ id, application, idCardPath ] = firstCall.args
                expect(id).to.equal('ID42')
                expect(application).to.deep.equal(expectedPreSaleApplication)

                assert(fs.existsSync(idCardPath))
            })

        })

        describe('GET /pre-sale/review/:publicId', () => {
            it('should return whatever handlers.get returns', async() => {
                const handler = {
                    get: sinon.stub()
                }
                const whatever = { whatevs : true}
                handler.get.withArgs('ID42').resolves(whatever)

                const app = getApp(handler)

                const response = await supertest(app)
                    .get('/pre-sale/review/ID42')
                    .expect(200)

                expect(response.body).to.deep.equal(whatever)
            })
        })

    })
})