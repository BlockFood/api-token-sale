const getPublicHandler = (db, idGenerator, emailSender) => {

    return {
        add: async (email) => {},
        update: async () => {},
        get: async () => {},
    }
}

const getPrivateHandler = (db) => {
    return {
        get: async () => {},
    }
}

module.exports = {
    getPublicHandler,
    getPrivateHandler,
}