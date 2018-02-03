const express = require('express')
const multiparty = require('multiparty')
const emailValidator = require('email-validator')

const getPublicApp = (preSaleHandler = {
    add: async () => {},
    update: async () => {},
    get: async () => {},
    getReferrents: async () => {},
}, airDropHandler = {
    add: async () => {},
    update: async () => {},
    get: async () => {},
    getReferrents: async () => {}
}, debug = false) => {
    const app = express()

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', debug ? '*' : 'https://blockfood.io')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })

    app.get('/pre-sale/new', async (req, res) => {
        const email = req.query.email
        const sponsor = req.query.sponsor || ''

        try {
            await preSaleHandler.add(email, sponsor)
            res.send({ ok: true })
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.post('/pre-sale/edit/:privateId', async (req, res) => {
        const privateId = req.params.privateId

        const form = new multiparty.Form({ autoFiles: true })

        form.parse(req, async (err, fields) => {
            if (err) {
                console.log('Unexpected error', err)
                res.send(500)
                return
            }

            try {
                const application = Object.keys(fields).reduce((application, key) => {
                    application[key] = fields[key][0]
                    return application
                }, {})
                await preSaleHandler.update(privateId, application)
                res.send({ ok: true })
            } catch (e) {
                res.status(500).send({ error: e.toString() })
            }
        })
    })

    app.get('/pre-sale/lock/:privateId', async (req, res) => {
        const privateId = req.params.privateId

        try {
            await preSaleHandler.lock(privateId)
            res.send({ ok: true })
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.post('/pre-sale/tx/:privateId/:txHash', async (req, res) => {
        const privateId = req.params.privateId
        const txHash = req.params.txHash

        if (!/0x[0-9A-Fa-f]+/.test(txHash) || txHash.length !== 66) {
            res.status(500).send({ error: (new Error('invalid transaction hash')).toString() })
            return
        }

        try {
            const application = await preSaleHandler.get(privateId)
            const txHashes = application.txHashes || []
            txHashes.push(txHash)
            await preSaleHandler.update(privateId, { txHashes }, false)
            res.send({ ok: true })
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/pre-sale/review/:privateId', async (req, res) => {
        try {
            const application = await preSaleHandler.get(req.params.privateId)
            res.send(application)
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/pre-sale/smart-contract', async (req, res) => {
        if (debug) {
            res.send({ address: '0x45B213dac7E8BD71Ffe8E09A7471dF8728155342' })
            return
        }
        res.send({ address: '0x762C128A5BAC6553e66fb2c07bEE864576966C26' })
    })

    app.get('/pre-sale/referrents/:publicId', async (req, res) => {
        try {
            const application = await preSaleHandler.getReferrents(req.params.publicId)
            res.send(application)
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/air-drop/new', async (req, res) => {
        const email = req.query.email
        const sponsor = req.query.sponsor || ''

        const airDroppers = airDropHandler.getAirDroppers()

        if (airDroppers >= 1300) {
            res.status(500).send({ error: 'limit reached' })
            return
        }

        try {
            await airDropHandler.add(email, sponsor)
            res.send({ ok: true })
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.post('/air-drop/edit/:privateId', async (req, res) => {
        const privateId = req.params.privateId

        const form = new multiparty.Form({ autoFiles: true })

        form.parse(req, async (err, fields) => {
            if (err) {
                console.log('Unexpected error', err)
                res.send(500)
                return
            }

            try {
                const application = Object.keys(fields).reduce((application, key) => {
                    application[key] = fields[key][0]
                    return application
                }, {})
                await airDropHandler.update(privateId, application)
                res.send({ ok: true })
            } catch (e) {
                res.status(500).send({ error: e.toString() })
            }
        })
    })

    app.get('/air-drop/review/:privateId', async (req, res) => {
        try {
            const application = await airDropHandler.get(req.params.privateId)
            res.send(application)
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/air-drop/referrents/:publicId', async (req, res) => {
        try {
            const application = await airDropHandler.getReferrents(req.params.publicId)
            res.send(application)
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    return app
}

const getPrivateApp = (preSaleHandler = {
    get: async () => {},
    getAll: async () => {},
    sendReminder: async () => {},
    accept: async () => {},
    reject: async () => {},
}, airDropHandler = {
    add: async () => {},
    getAll: async () => {},
    update: async () => {},
    get: async () => {},
    getReferrents: async () => {}
}, debug = false) => {
    const app = express()

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', debug ? '*' : 'https://blockfood.io')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })

    app.get('/admin/pre-sale/review/:publicId', async (req, res) => {
        const application = await preSaleHandler.get(req.params.publicId)
        res.send(application)
    })

    app.get('/admin/pre-sale/review', async (req, res) => {
        const applications = await preSaleHandler.getAll()
        res.send(applications)
    })

    app.get('/admin/pre-sale/reminder/:privateId', async (req, res) => {
        const privateId = req.params.privateId
        try {
            await preSaleHandler.sendReminder(privateId)
            res.send({ ok: true })
        } catch(e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/admin/pre-sale/accept/:privateId', async (req, res) => {
        const privateId = req.params.privateId
        try {
            await preSaleHandler.accept(privateId)
            res.send({ ok: true })
        } catch(e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/admin/pre-sale/reject/:privateId', async (req, res) => {
        const privateId = req.params.privateId
        try {
            await preSaleHandler.reject(privateId)
            res.send({ ok: true })
        } catch(e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/admin/air-drop/genesis/:email', async (req, res) => {
        const email = req.params.email
        try {
            await airDropHandler.add(email, undefined, true)
            res.send({ ok: true })
        } catch(e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/admin/air-drop/review', async (req, res) => {
        const applications = await airDropHandler.getAll()
        res.send(applications)
    })

    return app
}

const start = (app, port) => {
    console.log('BlockFood/api-token-sale :: API :: start on port ', port)
    app.listen(port)
}

module.exports = {
    getPublicApp,
    getPrivateApp,
    start
}
