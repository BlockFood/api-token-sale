const Mustache = require('mustache')
const minify = require('htmlmin')

module.exports = (transporter, template) => ({
    send: async (email, { title, content, signature }) => {

        console.log('Send mail', content)
        transporter.sendMail({
            from: 'no-reply@blockfood.io',
            to: email,
            subject: title,
            html: minify(Mustache.render(template, { title, content, signature }))
        })
    }
})