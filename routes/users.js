const express = require('express');
const router = express.Router()
const {User, validate} = require('../models/user');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const login = require('../middelware/login');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const config = require('config');
const crypto = require('crypto');

const transproter = nodemailer.createTransport({ 
    service: 'Gmail',
    auth: {
        user: 'socialmedianode1@gmail.com',
        pass: config.get('mailPassword')
    }
}); 

router.get('/me', login, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

router.get('/', async(req, res) => {
    const users = await User.find().sort('name');
    res.json(users)
});

router.post('/register', async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({email : req.body.email});
    if(user) return res.status(400).send(`User Already register`); 

    user = new User(_.pick(req.body, ['name', 'email', 'password', 'isAdmin']));
    
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    const token = user.generateAuthToken();
    res.header('x-auth-token', token).json(_.pick(user, ['name', 'email']));
});

router.put('/', login, async (req, res) => {
    const { error } =  validateUser(req.bod);
    if(error) return res.status(400).send(error.details[0].message);
    
    const user = await User.findById(req.user._id);
    
    user.name = req.body.name;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    await user.save();
    res.send(_.pick(user, ['name', 'email']));
});

router.post('/reset',  (req, res, next) => {
    const { error } = validateEmail(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    crypto.randomBytes(32, async (err, buffer) => { // to produce buffer as unique secure random value to access link to reset password
        
        if (err) {
            console.log(err);
            return res.status(400).send(`something goes worng`);
        }

        const token = buffer.toString('hex'); // hex type of encryption
        
        const user = await User.findOne({email : req.body.email});
        if (!user) return res.status(400).send('This Email Not found.');

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;

        await user.save();

        transproter.sendMail({
            to: req.body.email, // whitch enterd in form
            from: 'socialmedianode1@gmail.com',
            subject: 'Reset Password',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
                Please click on the following link, or paste this into your browser to complete the process:
                http://${req.headers.host}/api/users/reset/${token}
                If you did not request this, please ignore this email and your password will remain unchanged.`
        })
        res.status(200).send('Mail send');
    });
    
});

router.get('/reset/:token', async (req, res) => {
    const token = req.params.token;
    
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() }});
    if (!user) return res.status(400).send('Password reset token is invalid or has expired.');

    res.render('reset', { token: req.params.token });
});

router.post('/reset/:token', async (req, res) => {
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).send('Password reset token is invalid or has expired.');

    if(req.body.password === req.body.confirm) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
    }else {
        return res.status(400).send("Passwords do not match.");
    } 

    transproter.sendMail({
        to: req.body.email, // whitch enterd in form
        from: 'socialmedianode1@gmail.com',
        subject: 'Your password has been changed',
        text: `Hello,
          This is a confirmation that the password for your account ${user.email} has just been changed.`
    });

    res.status(200).send('Success! Your password has been changed.');
});


function validateUser(req) {
    const schema = {
        name : Joi.string().min(5).max(50).required(),
        password: Joi.string().min(8).max(1024).required()
    }

    return Joi.validate(req, schema);
}

function validateEmail(req) {
    const schema = {
        email : Joi.string().min(10).max(255).required().email()
    }
    return Joi.validate(req, schema);
}

module.exports = router;