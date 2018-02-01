const escape = require('escape-html')

module.exports = (send, getNextStepUrl) => {

    return {
        sendFirstEmail: async (email, privateId, publicId) => {
            await send(email, {
                title: 'BlockFood - Next Step for Pre-Sale',
                content: `<p>Thank you very much for applying to the pre-sale process.</p>
                    <p>In order to finalize your application, you must complete the following form:</p>
                    <p class='call-to-action-container'><a href='${getNextStepUrl(privateId)}' class='call-to-action'>Next step</a></p>
                    <br><br>
                    <h3>Your referral link</h3>
                    <p>
                    Here is your own personal referral link:<ul><li>
<a href='https://blockfood.io/pre-sale#ref=${publicId}' target='_blank'>https://blockfood.io/pre-sale#ref=${publicId}</a>
</li></ul><br>You can share this link either by copy/pasting the link above, or by using the following links:
<ul>
<li><a href='https://www.facebook.com/sharer/sharer.php?u=https%3A//blockfood.io/pre-sale%23ref=${publicId}' target='_blank'>Share on Facebook</a></li>
<li><a href='https://twitter.com/home?status=https%3A//blockfood.io/pre-sale%23ref=${publicId}' target='_blank'>Share on Twitter</a></li>
<li><a href='https://t.me/share/url?url=https://blockfood.io/pre-sale%23ref=${publicId}' target='_blank'>Share on Telegram</a></li>
</ul>
Check out our explanation of the referral program: <a href="https://medium.com/blockfood/blockfood-pre-sale-referral-program-93e9b87e94c8">BlockFood Pre-Sale Referral Program (medium)</a>
</p>
`,
                signature: 'Best regards,<br><br>BlockFood team'
            })
        },

        sendSecondEmail: async (email, application, now = new Date()) => {
            const getRemainingTime = (date) => {
                const diffInHours = (date.getTime() - now.getTime()) / (60 * 60 * 1000)

                const days =  ~~((diffInHours) / (24))
                const hours = ~~diffInHours
                if (days <= 0) {
                    return `${hours} hour${hours>1?'s':''}`
                }
                return `${days} day${days>1?'s':''}`
            }

            const endDate = new Date('2018-02-08T15:00:00.000Z')

            const name = application.firstName || 'early supporter'

            await send(email, {
                title: `BlockFood - ${getRemainingTime(endDate)} left for pre-sale`,
                content: `<p>Dear ${escape(name)},</p>
                    <p>Thank you very much for your participation to the BlockFood Pre-Sale.</p>
                    <p>There is still time to finalize your application. Follow the link below and start interacting with our smart contract.</p>
<p class='call-to-action-container'><a href='${getNextStepUrl(application.privateId)}' class='call-to-action'>Finalize application</a></p>
                    <p><i>Do not share this link with anyone. This is your private link.</i></p>
                    <p></p>
                    <p>We need your help! There is still time until the end of the pre-sale and our community is still growing. We need your help getting our message out there!<ul>
<li><a href="mailto:?&subject=I've participated to the BlockFood Pre-Sale&body=Hey%20there,%0A%0AI%20just%20want%20to%20share%20with%20you%20this%20project%20I%20like%0A%0Ahttps%3A//blockfood.io" target='_blank'>Send Email</a></li>
<li><a href="https://twitter.com/home?status=I've%20participated%20to%20the%20BlockFood%20Pre-Sale!%20Check%20out%20their%20awesome%20project%0A%0Ahttps%3A//blockfood.io" target='_blank'>Share on Twitter</a></li>
<li><a href='https://t.me/share/url?url=https://blockfood.io' target='_blank'>Share on Telegram</a></li>
<li><a href='https://www.facebook.com/sharer/sharer.php?u=https%3A//blockfood.io' target='_blank'>Share on Facebook</a></li>
<li><a href='https://plus.google.com/share?url=https%3A//blockfood.io' target='_blank'>Share on Google+</a></li>
<li><a href="https://www.linkedin.com/shareArticle?mini=true&url=https%3A//blockfood.io&title=BlockFood%20-%20World's%20first%20decentralized%20food%20ordering%20platform&summary=I've%20participated%20to%20the%20BlockFood%20Pre-Sale!%20Check%20out%20their%20awesome%20project&source=" target='_blank'>Share on LinkedIn</a></li>
<li><a href='https://pinterest.com/pin/create/button/?url=https%3A//blockfood.io&media=https%3A//blockfood.io/logo.png&description=' target='_blank'>Pin on Pinterest</a></li>
</ul></p>
<p>
                    Here is your own personal referral link:<ul><li>
<a href='https://blockfood.io/pre-sale#ref=${application.publicId}' target='_blank'>https://blockfood.io/pre-sale#ref=${application.publicId}</a>
</li></ul><br>You can share this link either by copy/pasting the link above, or by using the following links:
<ul>
<li><a href='https://www.facebook.com/sharer/sharer.php?u=https%3A//blockfood.io/pre-sale%23ref=${application.publicId}' target='_blank'>Share on Facebook</a></li>
<li><a href='https://twitter.com/home?status=https%3A//blockfood.io/pre-sale%23ref=${application.publicId}' target='_blank'>Share on Twitter</a></li>
<li><a href='https://t.me/share/url?url=https://blockfood.io/pre-sale%23ref=${application.publicId}' target='_blank'>Share on Telegram</a></li>
</ul>
Check out our explanation of the referral program: <a href="https://medium.com/blockfood/blockfood-pre-sale-referral-program-93e9b87e94c8">BlockFood Pre-Sale Referral Program (medium)</a>
</p>
<p>Thank you very much for your help. You are awesome!</p>
<p>Let's build a fairer future for the sharing economy together.</p>`,

                signature: 'Best regards,<br><br>BlockFood team'
            })
        },

        sendSuccessEmail: async (email, application) => {
            await send(email, {
                title: 'BlockFood - Your application has been accepted 🚀',
                content: `<p>Dear ${escape(application.firstName)},
<p>Your application to the BlockFood Pre-Sale has been <b>accepted</b>!</p>
<p>Thank you very much for your contribution. You are among our early supporters and for this, we will always be thankful at BlockFood.</p>
<p>We need your help! There is still time until the end of the pre-sale and our community is still growing. We need your help getting our message out there!<ul>
<li><a href="mailto:?&subject=I've participated to the BlockFood Pre-Sale&body=Hey%20there,%0A%0AI%20just%20want%20to%20share%20with%20you%20this%20project%20I%20like%0A%0Ahttps%3A//blockfood.io" target='_blank'>Send Email</a></li>
<li><a href="https://twitter.com/home?status=I've%20participated%20to%20the%20BlockFood%20Pre-Sale!%20Check%20out%20their%20awesome%20project%0A%0Ahttps%3A//blockfood.io" target='_blank'>Share on Twitter</a></li>
<li><a href='https://t.me/share/url?url=https://blockfood.io' target='_blank'>Share on Telegram</a></li>
<li><a href='https://www.facebook.com/sharer/sharer.php?u=https%3A//blockfood.io' target='_blank'>Share on Facebook</a></li>
<li><a href='https://plus.google.com/share?url=https%3A//blockfood.io' target='_blank'>Share on Google+</a></li>
<li><a href="https://www.linkedin.com/shareArticle?mini=true&url=https%3A//blockfood.io&title=BlockFood%20-%20World's%20first%20decentralized%20food%20ordering%20platform&summary=I've%20participated%20to%20the%20BlockFood%20Pre-Sale!%20Check%20out%20their%20awesome%20project&source=" target='_blank'>Share on LinkedIn</a></li>
<li><a href='https://pinterest.com/pin/create/button/?url=https%3A//blockfood.io&media=https%3A//blockfood.io/logo.png&description=' target='_blank'>Pin on Pinterest</a></li>
</ul></p>
<p>Thank you very much for your help. You are awesome!</p>
<p>Let's build a fairer future for the sharing economy together.</p>
`,
                signature: 'Best regards,<br><br>BlockFood team'
            })
        },

        sendFailureEmail: async (email, application) => {
            await send(email, {
                title: 'BlockFood - Your application has been declined',
                content: `<p>Dear ${escape(application.firstName)},
<p>Unfortunately, your application to the BlockFood Pre-Sale has been <b>declined</b> due to a failed KYC check.</p>
<p>Your participation was refunded to your Etherem address.</p>
<p>Sorry for the inconvenience and thank you very much for your help and for believing in us.</p>
`,
                signature: 'Best regards,<br><br>BlockFood team'
            })
        }
    }
}