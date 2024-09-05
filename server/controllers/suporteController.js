const mysqldump = require("mysqldump");
var fs = require("fs");

var path = require("path");
var db = JSON.parse(fs.readFileSync(path.join("./public","db.json"), "utf8"));
var cliente = JSON.parse(fs.readFileSync(path.join("./public","cliente.json"), "utf8"));

exports.backup = async (req, res) => {
  // dump the result straight to a file
  result = await mysqldump({
    connection: {
      host: db.endpoint,
      user: db.dbusername,
      password: db.dbsenha,
      database: db.dbname,
    },
    dumpToFile: `./${new Date()}.sql`,
  });
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
//   console.log(result);
};
