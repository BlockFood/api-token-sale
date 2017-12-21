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
        add: async (email) => {
            if (!emailValidator.validate(email)) {
                throw new Error('invalid email')
            }
            const privateId = idGenerator.generatePrivateId()
            const publicId = idGenerator.generatePublicId()

            await db.add({
                email,
                privateId,
                publicId
            })

            await emailSequence.sendFirstEmail(email, privateId)
        },
        update: async (privateId, email, application) => {
            if (application.isLocked) {
                throw new Error('application is locked')
            }

            if (!validateApplicationForUpdate(application)) {
                throw new Error(`missing fields: ${getMissingFieldsForUpdate(application).join(', ')}`)
            }

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
        lock: async (privateId) => {
            const applicationFromDB = await db.get(privateId)

            if (!applicationFromDB) {
                throw new Error('application not found')
            }

            const lockedApplication = Object.assign({}, applicationFromDB)
            lockedApplication.isLocked = true

            await db.update(privateId, lockedApplication)

            await emailSequence.sendSecondEmail(lockedApplication.email, lockedApplication)
        }
    }
}

const getPrivateHandler = (db) => {
    return {
        get: async (publicId) => {
            return db.getWithPublicId(publicId)
        },
    }
}

module.exports = {
    getPublicHandler,
    getPrivateHandler,
}
