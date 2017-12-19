const express = require('express')
const multiparty = require('multiparty')
const emailValidator = require('email-validator')

const getPublicApp = (handler = {
    add: () => {},
    update: () => {},
    get: async () => {},
}) => {
    const app = express()

    app.get('/pre-sale/new', async (req, res) => {
        const email = req.query.email

        try {
            await handler.add(email)
            res.end()
        } catch (e) {
            res.status(500).send({ error: e.toString() })
        }
    })

    app.post('/pre-sale/edit/:privateId', async (req, res) => {
        const privateId = req.params.privateId

        const form = new multiparty.Form({ autoFiles: true })

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.log(err)
                res.send(500)
                return
            }
            try {
                const originalApplication = await handler.get(privateId)
                const application = Object.keys(fields).reduce((application, key) => {
                    application[key] = fields[key][0]
                    return application
                }, {})
                const idCardPath = files['id_card'][0].path
                await handler.update(privateId, originalApplication.email, application, idCardPath)
                res.end()
            } catch (e) {
                res.status(500).send({ error: e.toString() })
            }
        })
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
}) => {
    const app = express()

    app.get('/admin/pre-sale/review/:publicId', async (req, res) => {
        const application = await handler.get(req.params.publicId)
        res.send(application)
    })
    return app
}

const start = (app, port) => {
    console.log('BlockFood-API :: start on port ', port)
    app.listen(port)
}

module.exports = {
    getPublicApp,
    getPrivateApp,
    start
}
