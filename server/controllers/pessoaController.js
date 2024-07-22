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
exports.view = (req, res) => {
  // pessoas the connection
  connection.query(
    'SELECT * FROM pessoas WHERE 1=1 AND  status = "active" ORDER BY nome',
    (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let removedPessoa = req.query.removed;
        res.render("pessoa", { rows, removedPessoa });
      } else {
        res.render("pessoa", { rows, error: err.sqlMessage });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
};

// Find Pessoa by Search
exports.find = (req, res) => {
  let searchTerm = req.body.search;
  // User the connection
  connection.query(
    "SELECT * FROM pessoas WHERE 1=1 AND  nome LIKE ? ",
    ["%" + searchTerm + "%"],
    (err, rows) => {
      if (!err) {
        res.render("pessoa", { rows });
      } else {
        res.render("pessoa", { rows, error: err.sqlMessage });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
};

exports.form = (req, res) => {
  res.render("add-pessoa");
};

// Add new pessoa
exports.create = (req, res) => {
  const { nome, tipo } = req.body;

  if (nome.length < 1 || tipo.length < 1) {
    res.render("add-pessoa", { error: "Nome/Tipo não informado(s)." });
    return;
  }

  // verica se já existe
  connection.query(
    `SELECT * FROM pessoas WHERE 1=1 AND  nome = ? AND status = "active";`,
    [nome],
    (err, rows) => {
      if (rows.length > 0) {
        res.render("add-pessoa", { rows, error: nome + " já existe !" });
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
                alert: `Pessoa ${nome} adicionada com sucesso !.`,
              });
            } else {
              res.render("add-pessoa", { rows, error: err.sqlMessage });
            }
            console.log("The data from pessoas table: \n", rows);
          }
        );
      }
    }
  );
};

// Edit pessoa
exports.edit = (req, res) => {
  // pessoas the connection
  connection.query(
    "SELECT * FROM pessoas WHERE 1=1 AND  id = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("edit-pessoa", { rows });
      } else {
        res.render("edit-pessoa", { rows, error: err.sqlMessage });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
};

// Update Pessoa
exports.update = (req, res) => {
  const { nome, tipo } = req.body;

  if (nome.length < 1 || tipo.length < 1) {
    res.render("edit-pessoa", { error: "Nome/Tipo não informado(s)." });
    return;
  }

  // pessoas the connection
  connection.query(
    "SELECT * FROM pessoas WHERE 1=1 AND  id <> ? AND nome = ? AND status = 'active'",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        // When done with the connection, release it
        if (rows.length > 0) {
          res.render("edit-pessoa", {
            rows,
            alert: `Pessoa ${nome} já existe !.`,
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
                  alert: `${nome} foi alterado !.`,
                });
              } else {
                res.render("edit-pessoa", { error: err.sqlMessage });
              }
            }
          );
        }
      } else {
        res.render("edit-pessoa", { error: err.sqlMessage });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
};

// Delete Pessoa
exports.delete = (req, res) => {
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
  connection.query(
    `SELECT COUNT(*) FROM lancamentos WHERE pes_id = ?;`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        if (rows[0]["COUNT(*)"] > 0) {
          res.render("view-pessoa", {
            error: `Impossível excluír Pessoa ID ${req.params.id}. Falha de integridade !.`,
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
                res.render("view-pessoa", { error: err.sqlMessage });
              }
              console.log("The data from beer table are: \n", rows);
            }
          );
        }
      } else {
        res.render("view-pessoa", {
          error: err.sqlMessage,
        });
      }
      console.log("The data from beer table are: \n", rows);
    }
  );
};

// View pessoas
exports.viewall = (req, res) => {
  // pessoas the connection
  connection.query(
    "SELECT * FROM pessoas WHERE 1=1 AND  id = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("view-pessoa", { rows });
      } else {
        res.render("view-pessoa", { error: err.sqlMessage });
      }
      console.log("The data from pessoas table: \n", rows);
    }
  );
};
