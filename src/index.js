const express = require('express')
const multiparty = require('multiparty')

const getApp = (handlers = {
    add: () => {},
    update: () => {},
    get: async () => {},
}) => {
    const app = express()

    app.get('/pre-sale/new', (req, res) => {
        handlers.add(req.query.email)
        res.end()
    })

    app.post('/pre-sale/edit/:publicId', (req, res) => {
        const form = new multiparty.Form({ autoFiles: true })

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.send(500)
                return
            }
            const publicId = req.params.publicId
            const application = Object.keys(fields).reduce((application, key) => {
                application[key] = fields[key][0]
                return application
            }, {})
            const idCardPath = files['id_card'][0].path

            handlers.update(publicId, application, idCardPath)
            res.end()
        })
    })

    app.get('/pre-sale/review/:publicId', async (req, res) => {
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
    getApp,
    start
}