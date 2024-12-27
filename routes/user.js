// Users routes
const express = require("express");
const routerUser = express.Router();
const User = require("../models/user");
const authMiddleware = require('../auth/auth-middleware');

//Register a user
routerUser.post("/user", async (req, res ) => {
    try{
        const { firstname, lastname, email, password } = req.body;

        const emailExists = await User.findOne({email});
        if (emailExists){ 
            return res.status(400).json({msg: "Email already in use"
            })
        };

        const newUser = new User({
            firstname,
            lastname,
            email,
            password
        });

        await newUser.save()
        .then((savedUser) => {
            console.log(savedUser);
            res.status(201).json({
                msg: "User is successfully saved",
                user: {
                    firstname: savedUser.firstname, 
                    id: savedUser._id, 
                    email: savedUser.email }
            })
        })
        .catch((error) => {
            console.log(error);

            if(error.code === 11000 && error.keyPattern && error.keyPattern.username) {
                res.status(500).json({msg: "Username already in use", error})
            }

            if(error.code === 11000 && error.keyPattern && error.keyPattern.email) {
                res.status(500).json({msg: "Email already in use", error})
            }

            res.status(500).json({msg: "Unable to create new user", error: error.message})
        })
    } catch(error) {
        console.log(error);
        res.status(500).json({msg: "Unable to save new user"});
    }
})

routerUser.get('/user', authMiddleware, async (req, res) => {
    try {
        const users = await User.find(); 
        console.log(users);
        res.status(200).json(users); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Unable to get users" });
    }
});


//GET one user for handling to login
routerUser.get('/user/:id', authMiddleware, async ( req, res ) => {
    try{
        const id= req.params.id;
        User.findById(id)
        .then(user => {
            console.log(user);
            res.status(200).json({user: {
                id: user._id,
                email:user.email,
                firstname: user.firstname
            }})
        }) 
        .catch(error => {
            console.log(error);
            res.status(500).json({msg: "Unable to get user"}); 
        }) 
    } catch(error) {
        console.log(error);
        res.status(500).json({msg: "Unable to get user"});
    }
})

module.exports = routerUser;