const express = require('express');
const users = require('../routes/users');
const login = require('../routes/login');
const post = require('../routes/post');

module.exports = function(app){
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/login', login);
    app.use('/api/post', post);

}