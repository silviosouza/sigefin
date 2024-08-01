const mysql = require("mysql");

// Connection Pool
let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true,
});

// View Pessoa
exports.view = async (req, res) => {
  // pessoas the connection
  await connection.query(
    'SELECT * FROM pessoas WHERE 1=1 AND  status = "active" ORDER BY nome',
    (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let removedPessoa = req.query.removed;
        res.render("pessoa", { rows, removedPessoa, session : req.session });
      } else {
        res.render("pessoa", { rows, error: err.sqlMessage, session : req.session });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
  // await connection.end();
};

// Find Pessoa by Search
exports.find = async (req, res) => {
  let searchTerm = req.body.search;
  // User the connection
  await connection.query(
    "SELECT * FROM pessoas WHERE 1=1 AND  nome LIKE ? ",
    ["%" + searchTerm + "%"],
    (err, rows) => {
      if (!err) {
        res.render("pessoa", { rows, session : req.session });
      } else {
        res.render("pessoa", { rows, error: err.sqlMessage, session : req.session });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
};

exports.form = async (req, res) => {
  res.render("add-pessoa", {session : req.session});
};

// Add new pessoa
exports.create = async (req, res) => {
  const { nome, tipo } = req.body;

  if (nome.length < 1 || tipo.length < 1) {
    res.render("add-pessoa", { error: "Nome/Tipo não informado(s).", session : req.session });
    return;
  }

  // verica se já existe
  await connection.query(
    `SELECT * FROM pessoas WHERE 1=1 AND nome = ? AND status = "active";`,
    [nome],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {
          res.render("add-pessoa", { rows, error: nome + " já existe !", session : req.session });
          return;
        } else {
          // pessoas the connection
          connection.query(
            "INSERT INTO pessoas SET nome = ?,  tipo = ?",
            [nome, tipo],
            (err, rows) => {
              if (!err) {
                res.render("add-pessoa", {
                  rows,
                  alert: `Pessoa ${nome} adicionada com sucesso !.`, session : req.session
                });
              } else {
                res.render("add-pessoa", { rows, error: err.sqlMessage, session : req.session });
              }
              console.log("The data from pessoas table: \n", rows);
            }
          );
        }
      } else {
        res.render("add-pessoa", { rows, error: err.sqlMessage, session : req.session });
      }
    }
  );
  // connection.end();
};

// Edit pessoa
exports.edit = async (req, res) => {
  // pessoas the connection
  await connection.query(
    "SELECT * FROM pessoas WHERE 1=1 AND id = ? AND status='active'",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("edit-pessoa", { rows, session : req.session });
      } else {
        res.render("edit-pessoa", { rows, error: err.sqlMessage, session : req.session });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
  // connection.end();
};

// Update Pessoa
exports.update = async (req, res) => {
  const { nome, tipo } = req.body;

  if (nome.length < 1 || tipo.length < 1) {
    res.render("edit-pessoa", { error: "Nome/Tipo não informado(s).", session : req.session });
    return;
  }

  // pessoas the connection
  await connection.query(
    "SELECT * FROM pessoas WHERE 1=1 AND id <> ? AND nome = ? AND status = 'active'",
    [req.params.id, nome],
    (err, rows) => {
      if (!err) {
        // When done with the connection, release it
        if (rows.length > 0) {
          res.render("edit-pessoa", {
            rows,
            alert: `Pessoa ${nome} já existe !.`, session : req.session
          });
          return;
        } else {
          connection.query(
            "UPDATE pessoas SET nome = ?, tipo = ? WHERE 1=1 AND  id = ? AND status = 'active'",
            [nome, tipo, req.params.id],
            (err, rows) => {
              if (!err) {
                res.render("edit-pessoa", {
                  // rows,
                  alert: `${nome} foi alterado !.`, session : req.session
                });
              } else {
                res.render("edit-pessoa", { error: err.sqlMessage, session : req.session });
              }
            }
          );
        }
      } else {
        res.render("edit-pessoa", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
  // connection.end();
};

// Delete Pessoa
exports.delete = async (req, res) => {
  // Delete a record

  // User the connection
  // connection.query('DELETE FROM user WHERE 1=1 AND  id = ?', [req.params.id], (err, rows) => {

  //   if(!err) {
  //     res.redirect('/');
  //   } else {
  //     console.log(err);
  //   }
  //   console.log('The data from user table: \n', rows);

  // });

  // Hide a record

  // Veifica integridade
  await connection.query(
    `SELECT COUNT(*) FROM lancamentos WHERE pes_id = ?;`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        if (rows[0]["COUNT(*)"] > 0) {
          res.render("view-pessoa", {
            error: `Impossível excluír Pessoa ID ${req.params.id}. Falha de integridade !.`, session : req.session
          });
          return;
        } else {
          connection.query(
            "SELECT nome FROM pessoas WHERE 1=1 AND  id = ?; UPDATE pessoas SET status = ? WHERE 1=1 AND  id = ?; ",
            [req.params.id, "removed", req.params.id],
            (err, rows) => {
              if (!err) {
                let removedPessoa = encodeURIComponent(
                  `Pessoa ${rows[0][0].nome} removida com sucesso.`
                );
                console.log(removedPessoa);
                res.redirect("/pessoa/?removed=" + removedPessoa);
              } else {
                res.render("view-pessoa", { error: err.sqlMessage, session : req.session });
              }
              console.log("The data from beer table are: \n", rows);
            }
          );
        }
      } else {
        res.render("view-pessoa", {
          error: err.sqlMessage, session : req.session
        });
      }
      console.log("The data from beer table are: \n", rows);
    }
  );
  // connection.end();
};

// View pessoas
exports.viewall = async (req, res) => {
  // pessoas the connection
  await connection.query(
    "SELECT * FROM pessoas WHERE 1=1 AND  id = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("view-pessoa", { rows, session : req.session });
      } else {
        res.render("view-pessoa", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
  // connection.end();
};
