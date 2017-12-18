const path = require('path')

const fs = require('fs-extra-promise')
const randomID = require('random-id')


module.exports = (storagePath) => {
    fs.ensureDirSync(storagePath)

    return {
        store: async (filePath) => {
            const extension = path.extname(filePath)
            const newFileName = randomID(15) + extension

            await fs.copyAsync(filePath, path.join(storagePath, newFileName))

            return newFileName
        }
    }
}