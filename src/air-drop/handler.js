const emailValidator = require('email-validator')

module.exports = (db, idGenerator, emailSequence) => {

    const mandatoryFields = [
        'ethAddress',
        'telegram',
        'twitter',
        //'publicReferral',
        //'publicBlockfood',
    ]

    const exportedFields = [
        'publicId',
        'privateId',
        'email',
        'ethAddress',
        'telegram',
        'twitter',
        'publicReferral',
        'publicBlockfood',
        'sponsor'
    ]

    const editableFields = [
        'ethAddress',
        'telegram',
        'twitter',
        'publicReferral',
        'publicBlockfood',
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
        add: async (email, sponsor, isGenesis = false, now = new Date()) => {
            if (!emailValidator.validate(email)) {
                throw new Error('invalid email')
            }

            if (!isGenesis) {
                const parent = await db.getWithPublicId(sponsor)

                if (!parent) {
                    throw new Error('invalid sponsor')
                }
            }

            const privateId = idGenerator.generatePrivateId()
            const publicId = idGenerator.generatePublicId()

            await db.add({
                email,
                privateId,
                publicId,
                sponsor,
                isAirDrop: true,
                creation: now
            })

            await emailSequence.sendFirstEmail(email, privateId, publicId)
        },
        update: async (privateId, application, validate = true, now = new Date()) => {
            if (validate && !validateApplicationForUpdate(application)) {
                throw new Error(`missing fields: ${getMissingFieldsForUpdate(application).join(', ')}`)
            }

            application = editableFields.reduce((cleanApplication, field) => {
                if (application[field]) {
                    cleanApplication[field] = application[field]
                }
                return cleanApplication
            }, {})

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
        },
        getAll: async () => db.getAll(),
    }
}

