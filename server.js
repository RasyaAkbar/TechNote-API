require('dotenv').config()
const express = require('express')
const app = express()
const { logger, logEvents } = require('./middleware/logger')
const path = require('path')
const errorHandler = require('./middleware/errrorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOption = require('./config/corsOption')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const PORT = process.env.PORT || 3500;

connectDB()

app.use(logger)//record event

app.use(cors(corsOption))

app.use(express.json()) //allow my application to process json

app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, '/public')))

app.use('/', require(path.join(__dirname, '/routes', '/root')))
app.use('/auth', require(path.join(__dirname, '/routes', '/authRoutes')))
app.use('/users', require(path.join(__dirname, '/routes', '/userRoutes')))
app.use('/notes', require(path.join(__dirname, '/routes', '/noteRoutes')))

app.all('*', (req, res)=>{
    res.status(404);
    if(req.accepts("html")){
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    }else if(req.accepts("json")){
        res.json({ message: "404 not found"})
    }else{
        res.type('txt').send('404 not found')
    }
})

app.use(errorHandler) //record error

mongoose.connection.once('open', ()=>{
    console.log("Connected to MongoDB")
    app.listen(PORT, ()=>console.log(`Server running at port ${PORT}`))
})

mongoose.connection.on('error', err =>{
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'MongoErrLog.log')
})


