const fs = require('fs')
const path = require('path')

const nodemailer = require('nodemailer')

const api = require('./src/api')
const handler = require('./src/handler')
const db = require('./src/db')
const emailSequence = require('./src/emailSequence')
const emailSender = require('./src/emailSender')

const template = fs.readFileSync(path.join(__dirname, 'template', 'mail.html'), 'utf-8')
const emailConfig = require('./email-config')

const isDebug = process.argv[2] === '--debug'

const start = async() => {
    api.start(
        api.getPrivateApp(
            handler.getPrivateHandler(
                await db('mongodb://127.0.0.1:27017/token-sale'),
                emailSequence(
                    emailSender(
                        nodemailer.createTransport(emailConfig),
                        template
                    ).send
                )
            ),
            isDebug
        ),
        25624 // block
    )
}

start().catch(e => console.log('Start failed: ', e))
