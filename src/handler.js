const getPublicHandler = (db, idGenerator, emailSender, storage) => {

    const mandatoryFields = [
        'firstName',
        'lastName',
        'dateOfBirth',
        'address',
        'postalCode',
        'city',
        'country',
        'nationality',
    ]

    const exportedFields = [
        'publicId',
        'privateId',
        'email',
        'firstName',
        'lastName',
        'dateOfBirth',
        'address',
        'postalCode',
        'city',
        'country',
        'nationality',
    ]

    const validateApplicationForUpdate = (application) =>
        mandatoryFields.reduce((isValid, field) => {
            return isValid && application[field]
        }, true)

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
        update: async (privateId, email, application, idCardPath) => {
            if (!validateApplicationForUpdate(application)) {
                throw new Error('Invalid application')
            }

            const updatedApplication = Object.assign({}, application)

            updatedApplication.idCardPath = await storage.store(idCardPath)

            await db.update(privateId, updatedApplication)

            await emailSender.sendSecondEmail(email, updatedApplication)
        },
        get: async (privateId) => {
            const applicationFromDB = await db.get(privateId)

            return exportedFields.reduce((application, field) => {
                application[field] = applicationFromDB[field]
                return application
            }, {})
        },
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