const fs = require('fs')
const path = require('path')

const nodemailer = require('nodemailer')

const api = require('./src/api')
const handler = require('./src/handler')
const db = require('./src/db')
const idGenerator = require('./src/idGenerator')
const emailSequence = require('./src/emailSequence')
const emailSender = require('./src/emailSender')
const storage = require('./src/storage')

const template = fs.readFileSync(path.join(__dirname, 'template', 'mail.html'), 'utf-8')

const emailConfig = require('./email-config')

const start = async () => {
    api.start(
        api.getPublicApp(
            handler.getPublicHandler(
                await db('mongodb://127.0.0.1:27017/token-sale'),
                idGenerator,
                emailSequence(
                    emailSender(
                        nodemailer.createTransport(emailConfig),
                        template
                    ).send,
                    (privateId) => `https://blockfood.io/pre-sale#privateId=${privateId}`
                ),
                storage(path.join(__dirname, 'store'))
            ),
            process.argv[2] === '--debug'
        ),
        3663 // food
    )
}

start().catch(e => console.log('Start failed: ', e))
