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
  if (!user_id) {
    return false;
  }
  // const clientes = await Clientes.findOne({ _id : ObjectId.createFromHexString(user_id) });
  try {
    const clientes = await Clientes.findOne({ _id: user_id }).lean().exec();

    if (!clientes) {
      return false;
    }

    const pool = mysql.createPool({
      host: clientes.endpoint,
      user: clientes.dbusername,
      password: clientes.dbsenha,
      database: clientes.dbname, //process.env.DB_NAME,
      port: process.env.DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
      idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      multipleStatements: true,
    });
    // console.log(clientes, pool)

    return pool;
  } catch (e) {
    console.log("errrrrrrrrroororororororororo");
    console.log(e.message);
    return false;
  }
};

module.exports = { fpool };
