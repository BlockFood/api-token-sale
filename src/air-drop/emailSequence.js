const escape = require('escape-html')

module.exports = (send) => {

    return {
        sendFirstEmail: async (email, id) => {
            await send(email, {
                title: 'BlockFood - Welcome to the BlockFood Air Drop Program',
                content: `
                <h2>Welcome to the BlockFood Air Drop Program</h2>
                <div>
                Follow this link to start with the program:
                <ul>
                <li><a href="https://blockfood.io/air-drop#id=${id}">https://blockfood.io/air-drop#id=${id}</a></li>
</ul>
                </div>
                `,
                signature: 'Best regards,<br><br>BlockFood team'
            })
        }
    }
}