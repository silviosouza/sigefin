const mysqldump = require("mysqldump");

exports.backup = async (req, res) => {
  // dump the result straight to a file
  result = await mysqldump({
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
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
