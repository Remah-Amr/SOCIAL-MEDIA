const express = require('express');
const router = express.router();
const Joi = require('joi');

router.post('/', (req, res) => {

})


function validation(req){
    const schema = {
        email : Joi.string().min(10).max(255).required().email(),
        password: Joi.string().min(8).max(1024).required()
    }
    return Joi.valid(req, schema)
}

module.exports = router;