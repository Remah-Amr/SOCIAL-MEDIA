const { User } = require('../models/user')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decode = jwt.verify(token, config.get('jwtKey'));
        req.user = decode;
        const user = await User.findOne({ _id: req.user._id })
        if (user.isAdmin == true)  next();
        else return res.status(401).json({ msg: "NOT ADMIN" })
    } catch (ex) {
        res.status(400).send('Invalid Token.');
    }
}