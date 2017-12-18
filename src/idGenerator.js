const uuidv4 = require('uuid/v4')

module.exports = {
    generatePublicId: () => uuidv4(),

    generatePrivateId: () => uuidv4(),
}