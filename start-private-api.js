const api = require('./src/api')
const handler = require('./src/handler')
const db = require('./src/db')

const isDebug = process.argv[2] === '--debug'

const start = async() => {
    api.start(
        api.getPrivateApp(
            handler.getPrivateHandler(
                await db('mongodb://127.0.0.1:27017/token-sale')
            ),
            isDebug
        ),
        25624 // block
    )
}

start().catch(e => console.log('Start failed: ', e))
