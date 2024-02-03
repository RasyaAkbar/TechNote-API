const User = require('../models/User')
const bcrypt = require('bcrypt')
const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken')

const login = asyncHandler(async(req, res) => {
    const { username, password } = req.body
    

    if(!username || !password){
        return res.status(400).json({ message: "All fields are required"})
    }

    const foundUser = await User.findOne({ username }).lean().exec()
    if(!foundUser || !foundUser.active){
        return res.status(401).json({ message: "Unauthorized"})
    }

    const match = await bcrypt.compare(password, foundUser.password)
    if(!match){
        return res.status(401).json({ message: "Wrong password"})
    }

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": foundUser.username,
                "roles": foundUser.roles
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    )
        
    const refreshToken = jwt.sign(
        { "username": foundUser.username},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    )

    res.cookie('jwt', refreshToken, {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: 'None', //cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000 //cookie expire match to refresh token
    })
    
    res.json({ accessToken })
    
})

const refresh = (req, res)=>{
    const cookies = req.cookies

    if(!cookies?.jwt){
        console.log("no cookies")
        return res.status(401).json({ message: "Unauthorized1"})
    }

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async(err, decoded) => {
            if(err){
                return res.status(403).json({ message: "Forbidden"})
            }

            const foundUser = await User.findOne({ username: decoded.username }).exec()
            if(!foundUser){
                return res.status(401).json({ message: "Unauthorized"})
            }

            const accessToken = jwt.sign(
                {
                    "UserInfo": 
                    {
                        "username": foundUser.username,
                        "roles": foundUser.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "15m"}
            )
            res.json({ accessToken })
        })
    )
}

const logout = (req, res)=>{
    const cookies = req.cookies
    if(!cookies?.jwt){
        return res.sendStatus(204) //no content
    }
    res.clearCookie('jwt', {httpOnly: true, secure: true, sameSite:'None'})
    res.status(204).json({ message: "Cookie cleared"})
    console.log("cookie cleared")
}

module.exports = {
    login,
    refresh,
    logout
}