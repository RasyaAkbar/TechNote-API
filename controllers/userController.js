const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

const getAllUsers = asyncHandler(async (req, res) => {
    //get all user from mongoDB
    const users = await User.find().select('-password').lean()
    //if no users
    if(!users?.length){
        return res.status(400).json({ message: 'No user found' })
    }
    res.json(users)
})


const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body

    //confirm all the field
    if(!username || !password || !Array.isArray(roles) || !roles.length){
        return res.status(400).json({ message: 'All fields are required'})
    }

    //check if duplicate username
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2}).lean().exec()
    if(duplicate){
        return res.status(409).json({ message: "Duplicate username "})
    }

    const hashedPwd = await bcrypt.hash(password, 10) //10 salt rounds

    const userObj = (!Array.isArray(roles) || !roles.length)? 
    { username, "password": hashedPwd}:
    { username, "password": hashedPwd, roles}
    

    //create new user
    const user = await User.create(userObj)

    if(user){//if created
        res.status(201).json({ message: `New User ${ user.username } is created`})
    } else {
        res.status(400).json({ message: 'Invalid user data received'})
    }
})


const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body

    if(!username || !id || typeof active!=='boolean' || !Array.isArray(roles) || !roles.length ){
        return res.status(400).json({ message: 'All fields are required'})
    }

    //check if user exist
    const user = await User.findById(id).exec()
    if(!user){
        return res.status(400).json({ message: 'No user found' })
    }

    //check if duplicate username
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2}).lean().exec() 
    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({ message: "Duplicate username "})
    }

    user.username = username
    user.roles = roles
    user.active = active

    //if they enter password to update
    if(password){
        user.password = await bcrypt.hash(password, 10)//10 salt rounds
    }

    const updatedUser = await user.save()

    res.json({ message: `User ${updatedUser.username} has been updated`})
})


const deleteUsers = asyncHandler(async (req, res) => {
    const { id } = req.body

    //check if user exist to delete
    const user = await User.findById(id).exec()
    if(!user){
        return res.status(400).json({ message: 'No user found' })
    }

    //delete user note if user has assigned note
    await Note.deleteMany({ user: id })

    await user.deleteOne()
    res.json( `User ${user.username} with id ${user._id} is deleted`)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUsers
}