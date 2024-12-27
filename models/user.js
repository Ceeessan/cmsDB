const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true,
        minLength: 3,
        maxLength: 35,
        trim: true,
        unique:true,  
        validate: {
        validator: function(value) {
            //Allows letters and numbers, then include @ and a domain like: .com
            const emailRegex = /^[a-zA-Z0-9åäöÅÄÖ._%+-]+@[a-zA-Z0-9åäöÅÄÖ.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(value);
        },
        message: props => `${props.value} is not a valid emailaddress!`
    }},
    password: { 
        type: String, 
        required: true,
        minLength: 10,
        maxLength: 30, 
    }
})

userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
}

//Hash password
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next();
})

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

module.exports = mongoose.model("user", userSchema)