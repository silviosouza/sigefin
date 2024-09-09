const mysql = require("mysql");

// MONGO_DB
const mongoose = require("mongoose"); // para trabalhar com nossa database
const Clientes = require("./server/models/Clientes");

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_DB_URI);

/* var fs = require("fs");
  var path = require("path");
  var db = JSON.parse(fs.readFileSync(path.join("./public","db.json"), "utf8")); */

// Connection Pool
const fpool = async (user_id) => {
  // const clientes = await Clientes.findOne({ _id : ObjectId.createFromHexString(user_id) });
  try {
    const clientes = await Clientes.findOne({ _id: user_id }).lean().exec();

    // console.log(user_id,clientes)

    pool = mysql.createPool({
      host: clientes.endpoint,
      user: clientes.dbusername,
      password: clientes.dbsenha,
      database: clientes.dbname, //process.env.DB_NAME,
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
    return pool;
  } catch (e) {
    console.log(">>>>>>>>>>>>>>>>>> e", clientes, e.message);
    console.log(e);
    return e.message;
  }
};

module.exports = { fpool };
