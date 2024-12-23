const express = require('express')
const app = express()

const mongoose =require('mongoose')
require('dotenv/config')

const bodyParser = require('body-parser')
const postsRoute = require('./routes/posts')
const authRoute = require('./routes/auth')


app.use(bodyParser.json())
app.use('/api/posts',postsRoute)
app.use('/api/user',authRoute)



app.get('/', (req,res) =>{
    res.send('Homepage')
})

mongoose.connect(process.env.DB_CONNECTOR).then(() => { console.log('Your mongoDB connector is on...')})

app.listen(3000, ()=>{
    console.log('Server is up and running...')
})
