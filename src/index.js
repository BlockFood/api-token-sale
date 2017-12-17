const express = require('express')
const multiparty = require('multiparty')

const getPublicApp = (handlers = {
    add: () => {},
    update: () => {},
    get: async () => {},
}) => {
    const app = express()

    app.get('/pre-sale/new', (req, res) => {
        handlers.add(req.query.email)
        res.end()
    })

    app.post('/pre-sale/edit/:privateId', (req, res) => {
        const form = new multiparty.Form({ autoFiles: true })

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.send(500)
                return
            }
            const privateId = req.params.privateId
            const application = Object.keys(fields).reduce((application, key) => {
                application[key] = fields[key][0]
                return application
            }, {})
            const idCardPath = files['id_card'][0].path

            handlers.update(privateId, application, idCardPath)
            res.end()
        })
    })

    app.get('/pre-sale/review/:privateId', async (req, res) => {
        const application = await handlers.get(req.params.privateId)
        res.send(application)
    })

    return app
}

const getPrivateApp = (handlers = {
    get: async () => {},
}) => {
    const app = express()

    app.get('/admin/pre-sale/review/:publicId', async (req, res) => {
        const application = await handlers.get(req.params.publicId)
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