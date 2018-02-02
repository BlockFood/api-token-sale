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

                const response = await supertest(app)
                    .get('/pre-sale/new?email=test@foo.bar&sponsor=sponsor_id')
                    .expect(200)

                expect(response.body).to.deep.equal({ ok: true })
            })
            it('should call handlers.add', async () => {
                const handler = {
                    add: sinon.stub()
                }
                const app = getPublicApp(handler)

                await supertest(app)
                    .get('/pre-sale/new?email=test@foo.bar&sponsor=sponsor_id')
                    .expect(200)

                assert(handler.add.calledWith('test@foo.bar', 'sponsor_id'))
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
                    country: 'what',
                }
                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .post('/pre-sale/edit/ID42')
                    .field('firstName', 'what')
                    .field('lastName', 'what')
                    .field('country', 'what')
                    .expect(200)

                const [firstCall] = handler.update.getCalls()

                const [id, application] = firstCall.args
                expect(id).to.equal('ID42')
                expect(application).to.deep.equal(expectedPreSaleApplication)

                expect(response.body).to.deep.equal({ ok: true })
            })

            it('should throw if handler.update throws', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.resolves({ email: 'foo@bar' })
                handler.update.rejects(new Error('missing fields'))

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .post('/pre-sale/edit/ID42')
                    .field('nationality', 'what')
                    .expect(500)

                expect(response.body.error).to.equal('Error: missing fields')
            })

            it('should throw if handler.get throws', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.update.rejects(new Error('missing fields'))

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .post('/pre-sale/edit/ID42')
                    .field('nationality', 'what')
                    .expect(500)

                expect(response.body.error).to.equal('Error: missing fields')
            })
        })

        describe('GET /pre-sale/lock/:privateId', () => {
            it('should call handler.lock', async () => {
                const handler = {
                    lock: sinon.stub()
                }

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .get('/pre-sale/lock/ID42')
                    .expect(200)

                assert(handler.lock.calledWith('ID42'))

                expect(response.body).to.deep.equal({ ok: true })
            })
            it('should throw if handler throws', async () => {
                const handler = {
                    lock: sinon.stub(),
                }
                handler.lock.rejects(new Error('application not found'))

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .get('/pre-sale/lock/ID42')
                    .expect(500)

                expect(response.body.error).to.equal('Error: application not found')
            })
        })

        describe('POST /pre-sale/tx/:privateId/:txHash', () => {
            it('should store the transaction hash in the database', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.withArgs('ID42').resolves({ email: 'foo@bar' })

                const expectedPreSaleApplication = {
                    txHashes: ['0x7611a27728c08a090088a86cab4157374e0edead4c80f44c4ac9c676a40c61c6']
                }
                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .post('/pre-sale/tx/ID42/0x7611a27728c08a090088a86cab4157374e0edead4c80f44c4ac9c676a40c61c6')
                    .expect(200)

                const [firstCall] = handler.update.getCalls()

                const [id, application, validate] = firstCall.args
                expect(id).to.equal('ID42')
                expect(application).to.deep.equal(expectedPreSaleApplication)
                expect(validate).to.equal(false)

                expect(response.body).to.deep.equal({ ok: true })
            })

            it('should be able to add several hashes', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.withArgs('ID42').resolves({
                    email: 'foo@bar',
                    txHashes: [
                        '0x4242427728c08a090088a86cab4157374e0edead4c80f44c4ac9c676a40c61c6'
                    ]
                })

                const expectedPreSaleApplication = {
                    txHashes: [
                        '0x4242427728c08a090088a86cab4157374e0edead4c80f44c4ac9c676a40c61c6',
                        '0x7611a27728c08a090088a86cab4157374e0edead4c80f44c4ac9c676a40c61c6'
                    ]
                }
                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .post('/pre-sale/tx/ID42/0x7611a27728c08a090088a86cab4157374e0edead4c80f44c4ac9c676a40c61c6')
                    .expect(200)

                const [firstCall] = handler.update.getCalls()

                const [_, application] = firstCall.args
                expect(application).to.deep.equal(expectedPreSaleApplication)
            })
            it('should throw if tx hash is not correct', async () => {
                const app = getPublicApp()

                const response = await supertest(app)
                    .post('/pre-sale/tx/ID42/0x7611a2772857374e0edead4c80f44c4ac9c676a40c61c6')
                    .expect(500)

                expect(response.body.error).to.equal('Error: invalid transaction hash')
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

        describe('GET /pre-sale/smart-contract', async () => {
            it('should return the correct addresses', async () => {
                const app = getPublicApp()

                const response = await supertest(app)
                    .get('/pre-sale/smart-contract')
                    .expect(200)

                expect(response.body.address).to.equal('0x762C128A5BAC6553e66fb2c07bEE864576966C26')
            })
            it('should return the debug value', async () => {
                const app = getPublicApp({},{}, true)

                const response = await supertest(app)
                    .get('/pre-sale/smart-contract')
                    .expect(200)

                expect(response.body.address).to.equal('0x45B213dac7E8BD71Ffe8E09A7471dF8728155342')
            })
        })

        describe('GET /pre-sale/referrents/:publicId', async () => {
            it('should return whatever handlers.referrents returns', async () => {
                const handler = {
                    getReferrents: sinon.stub()
                }
                const whatever = { whatevs: true }
                handler.getReferrents.withArgs('ID42').resolves(whatever)

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .get('/pre-sale/referrents/ID42')
                    .expect(200)

                expect(response.body).to.deep.equal(whatever)
            })
            it('should throw if handlers.get throws', async () => {
                const handler = {
                    getReferrents: sinon.stub()
                }
                handler.getReferrents.rejects(new Error('application not found'))

                const app = getPublicApp(handler)

                const response = await supertest(app)
                    .get('/pre-sale/referrents/ID42')
                    .expect(500)

                expect(response.body.error).to.equal('Error: application not found')
            })
        })

        describe('GET /air-drop/new', () => {
            it('should call handlers.add', async () => {
                const handler = {
                    add: sinon.stub()
                }
                const app = getPublicApp(undefined, handler)

                await supertest(app)
                    .get('/air-drop/new?email=test@foo.bar&sponsor=sponsor_id')
                    .expect(200)

                assert(handler.add.calledWith('test@foo.bar', 'sponsor_id'))
            })
            it('should throw if handler throws', async () => {
                const handler = {
                    add: sinon.stub()
                }
                handler.add.rejects(new Error('Invalid application, missing fields : a,b,c'))
                const app = getPublicApp({}, handler)

                const response = await supertest(app)
                    .get('/air-drop/new?email=invalid')
                    .expect(500)

                expect(response.body.error).to.equal('Error: Invalid application, missing fields : a,b,c')
            })
        })


        describe('POST /air-drop/edit/:privateId', () => {
            it('should call handlers.update with valid parameters', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.withArgs('ID42').resolves({ email: 'foo@bar' })
                const expectedAirDropApplication = {
                    ethAddress: '0x422222',
                }
                const app = getPublicApp({}, handler)

                const response = await supertest(app)
                    .post('/air-drop/edit/ID42')
                    .field('ethAddress', '0x422222')
                    .expect(200)

                const [firstCall] = handler.update.getCalls()

                const [id, application] = firstCall.args
                expect(id).to.equal('ID42')
                expect(application).to.deep.equal(expectedAirDropApplication)

                expect(response.body).to.deep.equal({ ok: true })
            })

            it('should throw if handler.update throws', async () => {
                const handler = {
                    get: sinon.stub(),
                    update: sinon.stub()
                }
                handler.get.resolves({ email: 'foo@bar' })
                handler.update.rejects(new Error('missing fields'))

                const app = getPublicApp({}, handler)

                const response = await supertest(app)
                    .post('/air-drop/edit/ID42')
                    .field('nationality', 'what')
                    .expect(500)

                expect(response.body.error).to.equal('Error: missing fields')
            })
        })


        describe('GET /air-drop/review/:privateId', () => {
            it('should return whatever handlers.get returns', async () => {
                const handler = {
                    get: sinon.stub()
                }
                const whatever = { whatevs: true }
                handler.get.withArgs('ID42').resolves(whatever)

                const app = getPublicApp({}, handler)

                const response = await supertest(app)
                    .get('/air-drop/review/ID42')
                    .expect(200)

                expect(response.body).to.deep.equal(whatever)
            })
            it('should throw if handlers.get throws', async () => {
                const handler = {
                    get: sinon.stub()
                }
                handler.get.rejects(new Error('application not found'))

                const app = getPublicApp({}, handler)

                const response = await supertest(app)
                    .get('/air-drop/review/ID42')
                    .expect(500)

                expect(response.body.error).to.equal('Error: application not found')
            })
        })


        describe('GET /air-drop/referrents/:publicId', async () => {
            it('should return whatever handlers.referrents returns', async () => {
                const handler = {
                    getReferrents: sinon.stub()
                }
                const whatever = { whatevs: true }
                handler.getReferrents.withArgs('ID42').resolves(whatever)

                const app = getPublicApp({}, handler)

                const response = await supertest(app)
                    .get('/air-drop/referrents/ID42')
                    .expect(200)

                expect(response.body).to.deep.equal(whatever)
            })
            it('should throw if handlers.get throws', async () => {
                const handler = {
                    getReferrents: sinon.stub()
                }
                handler.getReferrents.rejects(new Error('application not found'))

                const app = getPublicApp({}, handler)

                const response = await supertest(app)
                    .get('/air-drop/referrents/ID42')
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

        describe('GET /admin/pre-sale/review', () => {
            it('should return whatever handlers.getAll returns', async () => {
                const handler = {
                    getAll: sinon.stub()
                }
                const whatever = { whatevs: true }
                handler.getAll.resolves(whatever)

                const app = getPrivateApp(handler)

                const response = await supertest(app)
                    .get('/admin/pre-sale/review')
                    .expect(200)

                expect(response.body).to.deep.equal(whatever)
            })
        })

        describe('GET /admin/pre-sale/reminder/:privateId', () => {
            it('should call handler.sendReminder', async () => {
                const handler = {
                    sendReminder: sinon.stub()
                }

                const app = getPrivateApp(handler)

                await supertest(app)
                    .get('/admin/pre-sale/reminder/id42')
                    .expect(200)

                expect(handler.sendReminder.calledWith('id42'))
            })
            it('should throw if handler throws', async () => {
                const handler = {
                    sendReminder: sinon.stub()
                }
                handler.sendReminder.rejects(new Error('could not find application'))

                const app = getPrivateApp(handler)

                const response = await supertest(app)
                    .get('/admin/pre-sale/reminder/id42')
                    .expect(500)

                expect(response.body.error).to.equal('Error: could not find application')
            })
        })

        describe('GET /admin/pre-sale/accept/:privateId', () => {
            it('should call handler.accept', async () => {
                const handler = {
                    accept: sinon.stub()
                }

                const app = getPrivateApp(handler)

                await supertest(app)
                    .get('/admin/pre-sale/accept/id42')
                    .expect(200)

                expect(handler.accept.calledWith('id42'))
            })
            it('should throw if handler throws', async () => {
                const handler = {
                    accept: sinon.stub()
                }
                handler.accept.rejects(new Error('could not find application'))

                const app = getPrivateApp(handler)

                const response = await supertest(app)
                    .get('/admin/pre-sale/accept/id42')
                    .expect(500)

                expect(response.body.error).to.equal('Error: could not find application')
            })
        })

        describe('GET /admin/pre-sale/reject/:privateId', () => {
            it('should call handler.reject', async () => {
                const handler = {
                    reject: sinon.stub()
                }

                const app = getPrivateApp(handler)

                await supertest(app)
                    .get('/admin/pre-sale/reject/id42')
                    .expect(200)

                expect(handler.reject.calledWith('id42'))
            })
            it('should throw if handler throws', async () => {
                const handler = {
                    reject: sinon.stub()
                }
                handler.reject.rejects(new Error('could not find application'))

                const app = getPrivateApp(handler)

                const response = await supertest(app)
                    .get('/admin/pre-sale/reject/id42')
                    .expect(500)

                expect(response.body.error).to.equal('Error: could not find application')
            })
        })
    })
})
