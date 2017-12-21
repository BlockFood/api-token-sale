const emailValidator = require('email-validator')

const getPublicHandler = (db, idGenerator, emailSequence, storage) => {

    const mandatoryFields = [
        'firstName',
        'lastName',
        'birthYear',
        'birthMonth',
        'birthDay',
        'addressLine1',
        'postalCode',
        'city',
        'country',
        'nationality',
    ]

    const optionalFields = [
        'addressLine2',
        'state',
    ]

    const exportedFields = [
        'publicId',
        'privateId',
        'email',
        'firstName',
        'lastName',
        'birthYear',
        'birthMonth',
        'birthDay',
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'postalCode',
        'country',
        'nationality',
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
        update: async (privateId, email, application, idCardPath) => {
            if (application.isLocked) {
                throw new Error('application is locked')
            }

            if (!validateApplicationForUpdate(application)) {
                throw new Error(`missing fields: ${getMissingFieldsForUpdate(application).join(', ')}`)
            }

            const updatedApplication = Object.assign({}, application)

            updatedApplication.idCardPath = await storage.store(idCardPath)

            await db.update(privateId, updatedApplication)
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
