const express = require('express');
const exphbs = require('express-handlebars');
//const bodyParser = require('body-parser'); // No longer Required
//const mysql = require('mysql'); // Not required -> moved to userController

require('dotenv').config();

var session = require('express-session');

const app = express();
const port = process.env.PORT || 4321;

app.use(session({
    secret : 'webslesson',
    resave : true,
    saveUninitialized : true
  }));
  
// Parsing middleware
// Parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true })); // New

// Parse application/json
// app.use(bodyParser.json());
app.use(express.json()); // New

// Static Files
app.use(express.static(__dirname + '/public'));

// Templating Engine
const handlebars = exphbs.create({ extname: '.hbs', });
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

// You don't need the connection here as we have it in userController
// let connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME
// });

const routes = require('./server/routes/routes');
const path = require('path');
app.use('/', routes);
app.use('/auth', require('./server/routes/auth.js'))

app.listen(port, () => console.log(`Listening on port ${port}`));