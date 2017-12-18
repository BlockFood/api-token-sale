const randomID = require('random-id')

module.exports = {
    generatePublicId: () => randomID(30),

    generatePrivateId: () => randomID(30),
}