const emailValidator = require('email-validator')

const getPublicHandler = (db, idGenerator, emailSequence, storage) => {

    const mandatoryFields = [
        'firstName',
        'lastName',
        'country',
    ]

    const exportedFields = [
        'publicId',
        'privateId',
        'email',
        'firstName',
        'lastName',
        'country',
        'txHashes',
        'isLocked'
    ]

    const validateApplicationForUpdate = (application) =>
        mandatoryFields.reduce((isValid, field) => {
            return isValid && application[field]
        }, true)

    const getMissingFieldsForUpdate = (application) =>
        mandatoryFields.reduce((missingFields, field) => {
            if (!application[field]) {
                missingFields.push(field)
            }
            return missingFields
        }, [])

    return {
        validateApplicationForUpdate,
        getMissingFieldsForUpdate,
        add: async (email, now = new Date()) => {
            if (!emailValidator.validate(email)) {
                throw new Error('invalid email')
            }
            const privateId = idGenerator.generatePrivateId()
            const publicId = idGenerator.generatePublicId()

            await db.add({
                email,
                privateId,
                publicId,
                creation: now
            })

            await emailSequence.sendFirstEmail(email, privateId)
        },
        update: async (privateId, application, validate = true, now = new Date()) => {
            if (application.isLocked) {
                throw new Error('application is locked')
            }

            if (validate && !validateApplicationForUpdate(application)) {
                throw new Error(`missing fields: ${getMissingFieldsForUpdate(application).join(', ')}`)
            }

            application.lastUpdate = now

            await db.update(privateId, application)
        },
        get: async (privateId) => {
            const applicationFromDB = await db.get(privateId)

            if (!applicationFromDB) {
                throw new Error('application not found')
            }

            return exportedFields.reduce((application, field) => {
                application[field] = applicationFromDB[field]
                return application
            }, {})
        },
        lock: async (privateId, now = new Date()) => {
            const applicationFromDB = await db.get(privateId)

            if (!applicationFromDB) {
                throw new Error('application not found')
            }

            const lockedApplication = Object.assign({}, applicationFromDB)

            lockedApplication.isLocked = true
            lockedApplication.lockDate = now

            await db.update(privateId, lockedApplication)
        }
    }
}

const getPrivateHandler = (db, emailSequence) => {
    return {
        get: async (publicId) => db.getWithPublicId(publicId),
        getAll: async () => db.getAll(),
        sendReminder: async (privateId, now = new Date()) => {
            const applicationFromDb = await db.get(privateId)

            if (!applicationFromDb) {
                throw new Error('application not found')
            }

            if (!applicationFromDb.reminderDate) {
                applicationFromDb.reminderDate = now

                await emailSequence.sendSecondEmail(applicationFromDb.email, applicationFromDb)

                await db.update(privateId, applicationFromDb)
            }
        },

        accept: async (privateId, now = new Date()) => {
            const applicationFromDb = await db.get(privateId)

            if (!applicationFromDb) {
                throw new Error('application not found')
            }

            if (applicationFromDb.rejectDate) {
                throw new Error('application already rejected')
            }

            if (!applicationFromDb.acceptDate) {
                applicationFromDb.acceptDate = now

                await emailSequence.sendSuccessEmail(applicationFromDb.email, applicationFromDb)

                await db.update(privateId, applicationFromDb)
            }
        },

        reject: async (privateId, now = new Date()) => {
            const applicationFromDb = await db.get(privateId)

            if (!applicationFromDb) {
                throw new Error('application not found')
            }

            if (applicationFromDb.acceptDate) {
                throw new Error('application already rejected')
            }

            if (!applicationFromDb.rejectDate) {
                applicationFromDb.rejectDate = now

                await emailSequence.sendFailureEmail(applicationFromDb.email, applicationFromDb)

                await db.update(privateId, applicationFromDb)
            }
        },
    }
}

module.exports = {
    getPublicHandler,
    getPrivateHandler,
}
