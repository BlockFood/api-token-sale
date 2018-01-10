const express = require('express')
const axios = require('axios')
const fs = require('fs-extra-promise')
const os = require('os')
const path = require('path')
const tunnel = require('tunnel-ssh')

const app = express()

const privateKey = fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_rsa'), 'utf-8')

const config = {
    username: 'root',
    host: 'api.blockfood.io',
    port: 22,
    dstPort: 25624,
    localHost:'127.0.0.1',
    localPort: 25624,
    keepAlive: true,
    privateKey,
}


tunnel(config, function (error, server) {
    console.log('tunnel', error, server)
})


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

app.get('*', async (req, res) => {
    console.log(req.url)

    let data
    if (/^\/admin\//.test(req.url)) {
        data = await axios.get('http://localhost:25624' + req.url)
    } else {
        data = await axios.get('https://api.blockfood.io' + req.url)
    }

    res.send(data.data)
})

app.listen(3663)