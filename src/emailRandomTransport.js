const _ = require('lodash')

module.exports = (emailConfig, nodemailer) => {
    const transporters = emailConfig.auth.map(account => nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: false,
        auth: {
            user: account.user,
            pass: account.pass
        }
    }))


    return {
        sendMail: (mail) => {
            const randomTransporter = _.sample(transporters)

            return randomTransporter.sendMail(mail)
        }
    }
}