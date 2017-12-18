const getPublicHandler = (db, idGenerator, emailSender) => {

    return {
        add: async (email) => {
            const privateId = idGenerator.generatePrivateId()
            const publicId = idGenerator.generatePublicId()

            await db.add({
                email,
                privateId,
                publicId
            })

            await emailSender.sendFirstEmail(email, privateId)
        },
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