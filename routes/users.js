const express = require('express');
const router = express.Router()
const {User, validate} = require('../models/user');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const login = require('../middelware/login');
const Joi = require('joi');

router.get('/me', login, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

// router.get('/', async(req, res) => {
//     const users = User.find().sort('name');
//     res.send(users)
// });

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
    res.header('x-auth-token', token).send(_.pick(user, ['name', 'email']));
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


function validateUser(req) {
    const schema = {
        name : Joi.string().min(5).max(50).required(),
        password: Joi.string().min(8).max(1024).required()
    }

    return Joi.validate(req, schema);
}

module.exports = router;