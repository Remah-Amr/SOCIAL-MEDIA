const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        minlength: 5,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 1024
    },
    resetToken: String,
    resetTokenExpiration: Date,
    isAdmin: {type: Boolean, default: false}
});

userSchema.methods.generateAuthToken = function(){
    const token = jwt.sign({_id : this._id}, config.get('jwtKey'));
    return token;
}

const User = mongoose.model('User', userSchema);

function validateUser(user) {
    const schema = {
        name : Joi.string().min(5).max(50).required(),
        email: Joi.string().min(10).max(255).required().email(),
        password: Joi.string().min(8).max(1024).required(),
        
    }
    return Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;