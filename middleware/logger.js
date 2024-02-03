const { format } = require('date-fns')
const { v4: uuid } = require('uuid')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')

const logEvents = async (message, fileName) => {
    const dateTime = format(new Date(), 'dd/MM/yyyy\tHH:mm:ss')
    const logItems = `${dateTime}\t${uuid()}\t${message}\n`

    try{
        if(!fs.existsSync(path.join(__dirname,'..', 'logs'))){
            await fsPromises.mkdir(path.join(__dirname,'..', 'logs'))
        }
        await fsPromises.appendFile(path.join(__dirname,'..', 'logs', fileName), logItems)
    } catch (err){
        console.log(err)
    }
}

const logger = (req, res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.header.origins}`, 'reqLoq.log')
    console.log(`${req.method}\t${req.path}`)
    next()
}

module.exports = { logEvents, logger }

