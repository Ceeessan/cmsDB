const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {

    const token = req.header('Authorization')?.replace('Bearer ', '').trim();

    if(!token) {
        return res.status(401).json({msg: "Access denied. No token provided."})
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user){
            return res.status(401).json({msg: "User not found"})
        }

        req.user = user.toJSON();
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({msg: "Invalid or expired token"});
    }
}

module.exports = authMiddleware;