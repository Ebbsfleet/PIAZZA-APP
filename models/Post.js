
const mongoose = require('mongoose')


const PostSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    messageBody:{
        type:String,
        required:true
    },
    owner:{
        type:String,
        required:true
    },
    ownerName:{
        type:String,

    },
    topic:{
        type:Array,
        required:true
    },

    comments:[{comment: String, user: String, timeLeft: Number}],

    likes:[{user: String, timeLeft: Number}],

    dislikes:[{user: String, timeLeft: Number}],

    timestamp:{
        type:Date,
        default:Date.now
    },
    expirationTime:{
        type:Date,
        default:Date.now

    }
})

module.exports = mongoose.model('posts',PostSchema) 
