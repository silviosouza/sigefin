const session = require("express-session");
const moment = require("moment");
// require("mysql")
// const mysqldump = require("mysqldump");
const mysqlDump = require('node-mysql-dump');


var path = require("path");

// MONGO_DB
const mongoose = require("mongoose"); // para trabalhar com nossa database
const Clientes = require("../models/Clientes");

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_DB_URI);

exports.backup = async (req, res) => {
  const clientes = await Clientes.findOne({ _id: req.session.user_id })
  .lean()
  .exec();

  await mysqlDump({
    host: clientes.endpoint,
    user: clientes.dbusername,
    password: clientes.dbsenha,
    database: clientes.dbname,
    // tables: ['table1', 'table2'], // only these tables
    //@todo where: {'players': 'id < 1000'}, // Only test players with id < 1000
    //@todo ifNotExist:true, // Create table if not exist
    extendedInsert: true, // use one insert for many rows
    addDropTable: true,// add "DROP TABLE IF EXISTS" before "CREATE TABLE"
    addLocks: true,// add lock before inserting data
    disableKeys: true,//adds /*!40000 ALTER TABLE table DISABLE KEYS */; before insert
    dest: `./${req.session.user_id}_${moment(
          new Date(),
          "YYYYMMDD"
        ).format("YYYYMMDDHHmmss")}.sql` // destination file
  }, function (err) {
    if (err) throw err;
  
    // data.sql file created;
    res.render("home", {
      error: "Erro ao executar backup !.",
      session: req.session,
    });


  })
  
/*   try {
    const clientes = await Clientes.findOne({ _id: req.session.user_id })
      .lean()
      .exec();

    if (clientes) {
      // dump the result straight to a file
      result = await mysqldump({
        connection: {
          host: clientes.endpoint,
          user: clientes.dbusername,
          password: clientes.dbsenha,
          database: clientes.dbname,
        },
        dumpToFile: `./${req.session.user_id}_${moment(
          new Date(),
          "YYYYMMDD"
        ).format("YYYYMMDDHHmmss")}.sql`,
      });
    }
    if (!result) {
      res.render("home", {
        error: "Erro ao executar backup !.",
        session: req.session,
      });
    } else {
      // res.status(200).send({ message: "Backup realizado com sucesso" });
      res.render("home", {
        alert: "Backup executado com sucesso !.",
        session: req.session,
      });
    } 
  } catch (e) {
    console.log("Erro ao buscar cliente");
    res.render("home", {
      error: "Erro: 500 Internal Server Error !",
      session: req.session,
    });
    // return;
  } */
  // console.log(result);
};
