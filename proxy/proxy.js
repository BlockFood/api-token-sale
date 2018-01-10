const express = require('express')
const axios = require('axios')

const app = express()

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