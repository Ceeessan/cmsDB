const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./auth/auth');
const path = require('path');
const mediaPlayerRoutes = require('./routes/playback-device');

const app = express();

app.get('/', (req, res) => {
    res.json({msg: "Application is running!"})
})

app.use(express.json());

app.use(express.urlencoded({extended: true}));

app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/auth', authRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const user = require('./routes/user');
app.use("/api", user);

const content = require('./routes/content');
app.use("/api", content);

const playlist = require('./routes/playlist');
app.use("/api", playlist);

app.use('/api/playback-device', mediaPlayerRoutes);

//Connection from Mongoose to MongoDB
const connectToDB = async() => {
    try{
        await mongoose.connect('mongodb://localhost:27017/mydatabase');
        console.log("Connected to MongoDB");
    } catch(error){
        console.log(error);
        process.exit(1);
    }
}
connectToDB();

const port = 3000;
app.listen(port, () => {
    console.log("Server is running");
})
