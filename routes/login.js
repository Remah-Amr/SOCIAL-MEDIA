const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {User} = require('../models/user');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
    const { error } = validation(req.body);
    if (error) return res.send(error.details[0].message);
    
    let user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send("Invalid email or password.");

    const token = user.generateAuthToken();
    res.json({ "token": token });

});

function validation(req){
    const schema = {
        email : Joi.string().min(10).max(255).required().email(),
        password: Joi.string().min(8).max(1024).required()
    }
    return Joi.validate(req, schema)
}

module.exports = router;