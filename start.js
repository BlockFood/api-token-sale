const fs = require('fs')
const path = require('path')

const nodemailer = require('nodemailer')

const api = require('./src/api')
const preSaleHandler = require('./src/pre-sale/handler')
const airDropHandler = require('./src/air-drop/handler')
const db = require('./src/db')
const idGenerator = require('./src/idGenerator')
const preSaleEmailSequence = require('./src/pre-sale/emailSequence')
const airDropEmailSequence = require('./src/air-drop/emailSequence')
const emailSender = require('./src/emailSender')
const emailRandomTransport = require('./src/emailRandomTransport')

const template = fs.readFileSync(path.join(__dirname, 'template', 'mail.html'), 'utf-8')

const emailConfig = require('./email-config')

const isDebug = process.argv[2] === '--debug'



const start = async () => {
    api.start(
        api.getPublicApp(
            preSaleHandler.getPublicHandler(
                await db('mongodb://127.0.0.1:27017/token-sale'),
                idGenerator,
                preSaleEmailSequence(
                    emailSender(
                        emailRandomTransport(emailConfig, nodemailer),
                        template
                    ).send,
                    isDebug ?
                        (privateId) => `http://localhost:8080/blockfood.io/pre-sale#privateId=${privateId}` :
                        (privateId) => `https://blockfood.io/pre-sale#privateId=${privateId}`
                )
            ),
            airDropHandler(
                await db('mongodb://127.0.0.1:27017/air-drop'),
                idGenerator,
                airDropEmailSequence(
                    emailSender(
                        emailRandomTransport(emailConfig, nodemailer),
                        template
                    ).send,
                    isDebug ?
                        (privateId) => `http://localhost:8080/blockfood.io/airdrop#privateId=${privateId}` :
                        (privateId) => `https://blockfood.io/airdrop#privateId=${privateId}`
                )
            ),
            isDebug
        ),
        3663 // food
    )
}

start().catch(e => console.log('Start failed: ', e))
