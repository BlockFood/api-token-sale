const index = require('./src/index')

const privatePort = 25624 // block
const publicPort = 3663 // food

index.start(index.getPrivateApp(), privatePort)
index.start(index.getPublicApp(), publicPort)
