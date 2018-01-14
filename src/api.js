const express = require('express')
const multiparty = require('multiparty')
const emailValidator = require('email-validator')

const getPublicApp = (handler = {
    add: () => {},
    update: () => {},
    get: async () => {},
}, debug = false) => {
    const app = express()

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', debug ? '*' : 'https://blockfood.io')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })

    app.get('/pre-sale/new', async (req, res) => {
        const email = req.query.email

        try {
            await handler.add(email)
            res.send({ ok: true })
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.post('/pre-sale/edit/:privateId', async (req, res) => {
        const privateId = req.params.privateId

        const form = new multiparty.Form({ autoFiles: true })

        form.parse(req, async (err, fields, files) => {
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
                await handler.update(privateId, application)
                res.send({ ok: true })
            } catch (e) {
                res.status(500).send({ error: e.toString() })
            }
        })
    })

    app.get('/pre-sale/lock/:privateId', async (req, res) => {
        const privateId = req.params.privateId

        try {
            await handler.lock(privateId)
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
            const application = await handler.get(privateId)
            const txHashes = application.txHashes || []
            txHashes.push(txHash)
            await handler.update(privateId, { txHashes }, false)
            res.send({ ok: true })
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/pre-sale/review/:privateId', async (req, res) => {
        try {
            const application = await handler.get(req.params.privateId)
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

    return app
}

const getPrivateApp = (handler = {
    get: async () => {},
    getAll: async () => {},
    sendReminder: async () => {},
    accept: async () => {},
    reject: async () => {},
}, debug = false) => {
    const app = express()

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', debug ? '*' : 'https://blockfood.io')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })

    app.get('/admin/pre-sale/review/:publicId', async (req, res) => {
        const application = await handler.get(req.params.publicId)
        res.send(application)
    })

    app.get('/admin/pre-sale/review', async (req, res) => {
        const applications = await handler.getAll()
        res.send(applications)
    })

    app.get('/admin/pre-sale/email/reminder/:privateId', async (req, res) => {
        const privateId = req.privateId
        try {
            await handler.sendReminder(privateId)
            res.send({ ok: true })
        } catch(e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/admin/pre-sale/accept/:privateId', async (req, res) => {
        const privateId = req.params.privateId
        try {
            await handler.accept(privateId)
            res.send({ ok: true })
        } catch(e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.get('/admin/pre-sale/reject/:privateId', async (req, res) => {
        const privateId = req.params.privateId
        try {
            await handler.reject(privateId)
            res.send({ ok: true })
        } catch(e) {
            res.status(500).send({ error: e.toString() })
        }
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
