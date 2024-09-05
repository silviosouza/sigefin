const mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var db = JSON.parse(fs.readFileSync(path.join("./public","db.json"), "utf8"));

// Connection Pool
let pool = mysql.createPool({
    host: db.endpoint,
    user: db.dbusername,
    password: db.dbsenha,
    database: db.dbname,   //process.env.DB_NAME,
    port: process.env.DB_PORT,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // Máximo de conexões inativas; o valor padrão é o mesmo que "connectionLimit"
    idleTimeout: 60000, // Tempo limite das conexões inativas em milissegundos; o valor padrão é "60000"
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 60000,
  });
  
module.exports = {pool}