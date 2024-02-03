const jwt = require('jsonwebtoken')

const verifyJWT = (req, res, next) =>{
    const authHeader = req.headers.authorization || req.headers.Authorization
    console.log(req.headers.authorization)
    if(!authHeader?.startsWith('Bearer ')){
        console.log("no header")
        return res.status(401).json({ message: "Unauthorized"})
    }

    const accessToken = authHeader.split(' ')[1]

    jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) return res.status(403).json({ message: "Forbidden"})
            req.user = decoded.UserInfo.username
            req.roles = decoded.UserInfo.roles
            next()
        }
    )
}

module.exports = verifyJWT