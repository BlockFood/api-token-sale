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
                const originalApplication = await handler.get(privateId)
                const application = Object.keys(fields).reduce((application, key) => {
                    application[key] = fields[key][0]
                    return application
                }, {})
                await handler.update(privateId, originalApplication.email, application)
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

    app.get('/pre-sale/review/:privateId', async (req, res) => {
        try {
            const application = await handler.get(req.params.privateId)
            res.send(application)
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    return app
}

const getPrivateApp = (handler = {
    get: async () => {},
    getAll: async () => {},
}) => {
    const app = express()

    app.get('/admin/pre-sale/review/:publicId', async (req, res) => {
        const application = await handler.get(req.params.publicId)
        res.send(application)
    })

    app.get('/admin/pre-sale/review', async (req, res) => {
        const applications = await handler.getAll()
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
