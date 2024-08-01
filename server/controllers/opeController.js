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

// View Banco
exports.view = (req, res) => {
  // operacoes the connection
  connection.query(
    'SELECT id, descricao FROM operacoes WHERE 1=1 AND status = "active" ORDER BY descricao',
    (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let removedOpe = req.query.removed;
        res.render("ope", { rows, removedOpe, session : req.session });
      } else {
        res.render("ope", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from operacoes table: \n", rows);
    }
  );
  connection.end();
};

// Find Banco by Search
exports.find = (req, res) => {
  let searchTerm = req.body.search;
  // User the connection
  connection.query(
    'SELECT id, descricao, FROM operacoes WHERE 1=1 AND  status = "active" AND descricao LIKE ? ',
    ["%" + searchTerm + "%"],
    (err, rows) => {
      if (!err) {
        res.render("ope", { rows, session : req.session });
      } else {
        res.render("ope", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from operacoes table: \n", rows);
    }
  );
};

exports.form = (req, res) => {
  res.render("add-ope", {session : req.session});
};

// Add new banco
exports.create = (req, res) => {
  let { descricao } = req.body;
  let erro_msg;

  if (descricao.length < 1) {
    res.render("add-ope", { error: "Descrição não informada.", session : req.session });
    return;
  }

  let searchTerm = req.body.search;

  // verica se já existe
  connection.query(
    `SELECT * FROM operacoes WHERE 1=1 AND descricao = ? AND status = "active";`,
    [descricao],
    (err, rows) => {
      if (rows.length > 0) {
        res.render("add-ope", { error: descricao + " já existe !", session : req.session });
        return;
      } else {
        // bancos the connection
        connection.query(
          "INSERT INTO operacoes SET descricao = ?",
          [descricao],
          (err, rows) => {
            if (!err) {
              res.render("add-ope", {
                alert: `Operação ${descricao} adicionada com sucesso !.`, session : req.session
              });
            } else {
              res.render("add-ope", { error: err.sqlMessage, session : req.session });
            }
            console.log("The data from opercaoes table: \n", rows);
          }
        );
      }
    }
  );
};

// Edit banco
exports.edit = (req, res) => {
  // bancos the connection
  connection.query(
    "SELECT * FROM operacoes WHERE 1=1 AND  id = ? AND status = 'active'",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("edit-ope", { rows, session : req.session });
      } else {
        res.render("edit-ope", { rows, error: err.sqlMessage, session : req.session });
      }
      console.log("The data from operacoes table: \n", rows);
    }
  );
};

// Update Banco
exports.update = (req, res) => {
  const { descricao } = req.body;

  if (descricao.length < 1) {
    res.render("edit-ope", { error: "Descrição não informado.", session : req.session });
    return;
  }

  // bancos the connection
  connection.query(
    "SELECT * FROM operacoes WHERE 1=1 AND descricao = ? AND status = 'active' AND id <> ?",
    [descricao, req.params.id],
    (err, rows) => {
      // When done with the connection, release it

      if (!err) {
        if (rows.length > 0) {
          res.render("edit-ope", { rows, error: descricao + " já existe !", session : req.session });
          return;
        } else {
          // bancos the connection
          connection.query(
            "UPDATE operacoes SET descricao = ? WHERE 1=1 AND  id = ? AND status = 'active'",
            [descricao, req.params.id],
            (err, rows) => {
              if (!err) {
                res.render("edit-ope", {
                  // rows,
                  alert: `${descricao} foi atualizada.`, session : req.session
                });
              } else {
                res.render("edit-ope", { rows, error: err.sqlMessage, session : req.session });
              }
              console.log("The data from operacoes table: \n", rows);
            }
          );
        }
      } else {
        res.render("edit-ope", { rows, error: err.sqlMessage, session : req.session });
      }
      console.log("The data from operacoes table: \n", rows);
    }
  );
};

// Delete Banco
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
    `SELECT COUNT(*) FROM lancamentos WHERE ope_id = ?;`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        if (rows[0]["COUNT(*)"] > 0) {
          res.render("view-ope", {
            error: `Impossível excluír Operação ID ${req.params.id}. Falha de integridade !.`, session : req.session
          });
          return;
        } else {
          connection.query(
            "SELECT descricao FROM operacoes WHERE 1=1 AND id = ? AND status = 'active'; UPDATE operacoes SET status = ? WHERE 1=1 AND  id = ?;",
            [req.params.id, "removed", req.params.id],
            (err, rows) => {
              if (!err) {
                let removedOpe = encodeURIComponent(
                  `Operação ${rows[0][0].descricao} foi removida.`
                );
                res.redirect("/ope/?removed=" + removedOpe);
              } else {
                res.render("view-ope", { rows, error: err.sqlMessage, session : req.session });
              }
              console.log("The data from beer table are: \n", rows);
            }
          );
        }
      } else {
        res.render("view-ope", {
          error: err.sqlMessage, session : req.session
        });
      }
      console.log("The data from beer table are: \n", rows);
    }
  );
};

// View bancos
exports.viewall = (req, res) => {
  // bancos the connection
  connection.query(
    'SELECT id, descricao FROM operacoes WHERE 1=1 AND  id = ?',
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("view-ope", { rows, session : req.session });
      } else {
        res.render("view-ope", { rows, error: err.sqlMessage, session : req.session });
      }
      console.log("The data from operacoes table: \n", rows);
    }
  );
};
