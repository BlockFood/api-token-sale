const escape = require('escape-html')

module.exports = (send, getAirDropPortalUrl = (a) => `${a}`) => {

    return {
        sendFirstEmail: async (email, privateId) => {
            await send(email, {
                title: 'BlockFood - Welcome to the BlockFood Air Drop Program',
                content: `
                <h2>Welcome to the BlockFood Air Drop Program</h2>
                <div>
                Follow this link to start with the program:
                <ul>
                <li><a href="${getAirDropPortalUrl(privateId)}">${getAirDropPortalUrl(privateId)}</a></li>
</ul>
                </div>
                `,
                signature: 'Best regards,<br><br>BlockFood team'
            })
        }
    }
}