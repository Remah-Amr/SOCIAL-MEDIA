const express = require('express');
const router = express.Router()
const {User, validate} = require('../models/user');
const _ = require('lodash');
const bcrypt = require('bcrypt');


router.post('/register', async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({email : req.body.email});
    if(user) return res.status(400).send(`User Already register`); 

    user = new User(_.pick(req.user, ['name', 'email', 'password', 'isAdmin']));
    
    const salt  = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    res.status(200).send(_.pick(user, ['name']))
});

module.exports = router