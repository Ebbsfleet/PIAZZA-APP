const express = require('express')
const router = express.Router()

const Post = require('../models/Post')
const verifyToken = require('../verifyToken')

// POST (Create data)
router.post('/', verifyToken, async(req,res)=>{
    //console.log(req.body)
    console.log("New post by user id:  "+req.user._id+"!") 

    // Code to create a revised datestamp from an hour translation (5 mins would be 0.08334 hrs).
    const addMinutesToDate = (date, n) => {
        const d = new Date(date);
        d.setTime(d.getTime() + n * 3600000);
        return d;
      };
    
    const postData = new Post({
        title:req.body.title,
        messageBody:req.body.messageBody,
        owner:req.user,
        topic:req.body.topic,
        // Takes expiration as time in hours and stores as expiration datestamp
        expirationTime:addMinutesToDate(Date(), req.body.expirationTime)
    })

    try{
        const postToSave = await postData.save()
        res.send(postToSave)
    }catch(err){
        res.send({message:err})
    }
})

// GET (Read everything)
router.get('/', verifyToken, async(req,res) =>{
    try{
        const getPosts = await Post.find().limit(10)
        res.send(getPosts)
    }catch(err){
        res.send({message:err})
    }
})

// GET (Read by ID)
router.get('/:postId', verifyToken, async(req,res) =>{
    try{
        const getPostById = await Post.findById(req.params.postId)
        res.send(getPostById)
    }catch(err){
        res.send({message:err})
    }
})

// GET (Read by Topic)
router.get('/topic/:topic', verifyToken, async(req,res) =>{
    try{
        const getPostsByTopic = await Post.find( {topic: req.params.topic} )
        res.send(getPostsByTopic)
    }catch(err){
        res.send({message:err})
    }
})

// GET (Read by Expired - expiration date in the past)
router.get('/status/expired', verifyToken, async(req,res) =>{
    try{
        const getPostsByStatus = await Post.find( {expirationTime: { $lt: Date()}} )
        res.send(getPostsByStatus)
    }catch(err){
        res.send({message:err})
    }
})

// GET (Read by Live - expiration date in the future)
router.get('/status/live', verifyToken, async(req,res) =>{
    try{
        const getPostsByStatus = await Post.find( {expirationTime: { $gt: Date()}} )
        res.send(getPostsByStatus)
    }catch(err){
        res.send({message:err})
    }
})

// GET (Read by Expired & Topic)
router.get('/topic/:topic/status/expired/', verifyToken, async(req,res) =>{
    try{
        const getPostsByStatus = await Post.find({$and: [{expirationTime: { $lt: Date()}, topic: req.params.topic} ]})
        res.send(getPostsByStatus)
        console.log("Get "+req.params.topic+" and Expired!")   
    }catch(err){
        console.log("Get "+req.params.topic+" and Expired!") 
        res.send({message:err})
    }
})

// GET (Read by Live & Topic)
router.get('/topic/:topic/status/live/', verifyToken, async(req,res) =>{
    try{
        const getPostsByStatus = await Post.find({$and: [{expirationTime: { $gt: Date()}, topic: req.params.topic } ]})
        res.send(getPostsByStatus)
        console.log("Get "+req.params.topic+" and Live!")  
    }catch(err){
        console.log("Get "+req.params.topic+" and Live!") 
        res.send({message:err})
    }
})

// GET (Top trending (most likes/dislikes/comments) by Topic - assumes must be live)
router.get('/trending/:topic', verifyToken, async(req,res) =>{
    try{
        const getPostsByStatus = await Post.find( {expirationTime: { $gt: Date()}} )
        res.send(getPostsByStatus)
    }catch(err){
        res.send({message:err})
    }
})



// PATCH (Update post)
router.patch('/:postId', verifyToken, async(req,res) =>{
    try{
        const updatePostById = await Post.updateOne(
            {_id:req.params.postId},
            {$set:{
                title:req.body.title,
                messageBody:req.body.messageBody,
                owner:req.user,
                topic:req.body.topic,
                status:req.body.status,
                }
            },            
            {$push:{
                comments:req.body.comments,

            }})
            
        res.send(updatePostById)
    }catch(err){
        res.send({message:err})
    }
})

// PATCH (Add comment)
router.patch('/comment/:postId', verifyToken, async(req,res) =>{
    try{
        const updatePostById = await Post.updateOne(
            // Check that post is not expired.
            { $and: [{ _id: req.params.postId, expirationTime: { $gt: Date()}}] },    
            {$push:{
                comments:req.body.comments,
                timeleft:req.body.timeleft
            }})
        // Debugging - remove these console hints from production
        console.log("Post ("+req.params.postId+") attempted comment added by: " + req.user._id + "!")    
        res.send(updatePostById)
    }catch(err){
        res.send({message:err})
    }
})

// PATCH (Add like)
router.patch('/like/:postId', verifyToken, async (req, res) => {
    try {
        const updatePostById = await Post.updateOne(
            // Check ID from verifyToken and post owner - to block users liking their own post. Also check that the post is not expired.
            { $and: [{ _id: req.params.postId, owner: { $not: { $eq: req.user._id } }, expirationTime: { $gt: Date()}}] },
            {
                $push: {
                    // Sub-docuents
                    likes: [{ user: req.user, timeLeft: req.body.timeLeft }],
                }
            }
        )
        // Debugging - remove these console hints from production
        console.log("Post ("+req.params.postId+") attempted like by: " + req.user._id + "!")
        res.send(updatePostById)
    } catch (err) {
        res.send({ message: "Posters cannot like their own posts." })
    }
})

// PATCH (Add dislike)
router.patch('/dislike/:postId', verifyToken, async (req, res) => {
    try {
        const updatePostById = await Post.updateOne(
            // Check ID from verifyToken and post owner - to block users liking their own post. Also check that the post is not expired.
            { $and: [{ _id: req.params.postId, owner: { $not: { $eq: req.user._id } }, expirationTime: { $gt: Date()}}] },
            {
                $push: {
                    // Sub-docuents
                    dislikes: [{ user: req.user, timeLeft: req.body.timeLeft }],
                }
            }
        )
        // Debugging - remove these console hints from production
        console.log("Post ("+req.params.postId+") attempted dislike by: " + req.user._id + "!")
        res.send(updatePostById)
    } catch (err) {
        res.send({ message: "Posters cannot dislike their own posts." })
    }
})

// DELETE (Delete)
router.delete('/:postId', verifyToken, async(req,res)=>{
    try{
        const deletePostById = await Post.deleteOne({_id:req.params.postId})
        res.send(deletePostById)
    }catch(err){
        res.send({message:err})
    }
})

module.exports = router