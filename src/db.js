const MongoClient = require('mongodb').MongoClient

module.exports = async (dbUri, collectionName = 'pre-sale-applications') => {
    const client = await MongoClient.connect(dbUri)
    const db = client.db('token-sale')
    const collection = db.collection(collectionName)

    return {
        add: async (application) => {
            await collection.insertOne(application)
        },

        update: async (privateId, application) => {
            await collection.findOneAndUpdate(
                { privateId },
                { $set: application }
            )
        },

        get: async (privateId) => {
            return await collection.findOne({ privateId })
        },

        getWithPublicId: async (publicId) => {
            return await collection.findOne({ publicId })
        },

        getAll: async () => {
            return await collection.find().toArray()
        },

        close: async () => client.close()
    }
}