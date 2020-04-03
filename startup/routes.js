const express = require('express');
const users = require('../routes/users');
const login = require('../routes/login');

module.exports = function(app){
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/login', login);
}