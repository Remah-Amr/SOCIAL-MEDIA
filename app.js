const express = require('express');
const app = express()

require('express-async-errors');
require('./startup/db')();
require('./startup/routes')(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listen on port ${port}...`);
})