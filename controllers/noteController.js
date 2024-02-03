const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler') //to catch unexpected error and send it to errLog
const bcrypt = require('bcrypt')

const createNewNote = asyncHandler(async (req, res) => {
    const { users,title, text } = req.body
    if(!users || !title  || !text){
        return res.status(400).json({ message: 'All field are required'})
    }

    
    await Promise.all(users.map(async(userId)=>{
        await Note.create({ user: userId, title, text })
    }))
    return res.status(201).json({ message: 'New note created'})
    
    
        
    


    // const newNote = await Note.create({ user: user._id, title, text })
})

const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean()
    if (!notes?.length){
        return res.status(400).json({ message: 'Notes not found'})
    }

    const getNotes = await Promise.all(notes.map(async (note) => {
        const users = await User.findById(note.user).lean().exec()
        return {...note, username: users.username} //declaring username from user database
    }))
    res.json(getNotes)
})

const updateNote = asyncHandler(async (req, res) => {
    const {id, users, title, text, completed } = req.body
    if(!id || !users.length || !title || !text || typeof completed !== 'boolean'){
        return res.status(400).json({ message: 'All fields required'})
    }

    const note = await Note.findById(id).exec()
    if(!note){
        return res.status(400).json({ message: 'Note not found'})
    }

    if(users.length > 1){
        await Promise.all(users.map(async(userId) =>{
            await Note.create({ user: userId, title, text , completed})
        }))
    }else{
        note.user = users[0]
        note.title = title
        note.text = text
        note.completed = completed
        await note.save()
    }
    
    res.json(`${note.title} is created`)
})


const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body
    if(!id){
        return res.status(400).json({ message: 'ID is required'})
    }
    
    const note = await Note.findById(id).exec()
    if(!note){
        res.status(400).json({ message: 'Notes not found'})
    }

    await note.deleteOne()
    res.json(`${note.title} is deleted`)
})

module.exports = {
    getAllNotes,
    deleteNote,
    updateNote,
    createNewNote
}