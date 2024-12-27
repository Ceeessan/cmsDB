const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const routerLoggedIn = express.Router();
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

function generateToken ( user ) {
    return jwt.sign(
        { id: user._id, email:user.email, firstname: user.firstname},
        jwtSecret, 
        {expiresIn: '10h'});
}

routerLoggedIn.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Received login request:", email);

    try{
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({msg: 'User does not exist'})
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(400).json({msg: "Wrong password"});
        }
        
        const token = generateToken(user);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstname: user.firstname
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({msg: 'Serverfel'});
    }
})

module.exports = routerLoggedIn;