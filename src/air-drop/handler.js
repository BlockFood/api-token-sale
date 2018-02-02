const emailValidator = require('email-validator')

module.exports = (db, idGenerator, emailSequence) => {

    const mandatoryFields = [
        'ethAddress',
        'sponsor'
    ]

    const exportedFields = [
        'publicId',
        'privateId',
        'email',
        'ethAddress',
        'sponsor'
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
        add: async (email, sponsor, now = new Date()) => {
            if (!emailValidator.validate(email)) {
                throw new Error('invalid email')
            }
            const privateId = idGenerator.generatePrivateId()
            const publicId = idGenerator.generatePublicId()

            await db.add({
                email,
                privateId,
                publicId,
                sponsor,
                creation: now
            })

            await emailSequence.sendFirstEmail(email, privateId, publicId)
        },
        update: async (privateId, application, validate = true, now = new Date()) => {
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
        getReferrents: async (publicId) => {
            const applications = await db.getAll()

            applications.forEach(application => {
                application.referrents = applications.filter(app => app.sponsor === application.publicId)
            })

            return applications.find(application => application.publicId === publicId)
        }
    }
}

