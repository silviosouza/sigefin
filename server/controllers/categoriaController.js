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

// View Categoria
exports.view = (req, res) => {
  // Categorias the connection
  connection.query(
    'SELECT * FROM categorias WHERE 1=1 AND status = "active" ORDER BY descricao',
    (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let removedCategoria = req.query.removed;
        res.render("categoria", { rows, removedCategoria });
      } else {
        res.render("categoria", { error: err.sqlMessage });
      }
      console.log("The data from categorias table: \n", rows);
    }
  );
};

// Find Categoria by Search
exports.find = (req, res) => {
  let searchTerm = req.body.search;
  // User the connection
  connection.query(
    "SELECT * FROM categorias WHERE 1=1 AND status='active' AND descricao LIKE ? ",
    ["%" + searchTerm + "%"],
    (err, rows) => {
      if (!err) {
        res.render("categoria", { rows });
      } else {
        res.render("categoria", { error: err.sqlMessage });
      }
      console.log("The data from categorias table: \n", rows);
    }
  );
};

exports.form = (req, res) => {
  res.render("add-categoria");
};

// Add new categoria
exports.create = (req, res) => {
  const { descricao } = req.body;

  if (descricao.length < 1) {
    res.render("add-categoria", { error: "Descrição não informada." });
    return;
  }

  // verica se já existe
  connection.query(
    `SELECT * FROM categorias WHERE 1=1 AND descricao = ? AND status = "active";`,
    [descricao],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {
          res.render("add-categoria", { error: descricao + " já existe !" });
          return;
        } else {
          // Categorias the connection
          connection.query(
            "INSERT INTO categorias SET descricao = ?",
            [descricao],
            (err, rows) => {
              if (!err) {
                res.render("add-categoria", {
                  alert: `Categoria ${descricao} adicionada com sucesso.`,
                });
              } else {
                res.render("add-categoria", { error: err.sqlMessage });
              }
            }
          );
        }
      } else {
        res.render("add-categoria", { error: err.sqlMessage });
      }
      console.log("The data from categorias table: \n", rows);
    }
  );
};

// Edit categoria
exports.edit = (req, res) => {
  // Categorias the connection
  connection.query(
    "SELECT * FROM categorias WHERE 1=1 AND status='active' AND id = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("edit-categoria", { rows });
      } else {
        res.render("edit-categoria", { error: err.sqlMessage });
      }
      console.log("The data from categorias table: \n", rows);
    }
  );
};

// Update Categoria
exports.update = (req, res) => {
  const { descricao } = req.body;

  if (descricao.length < 1) {
    res.render("edit-categoria", { error: "Nome/Tipo não informado(s)." });
    return;
  }

  // Categorias the connection
  connection.query(
    "SELECT * FROM categorias WHERE 1=1 AND status='active' AND descricao = ? AND id <> ?",
    [descricao, req.params.id],
    (err, rows) => {
      // console.log(rows);
      // When done with the connection, release it
      if (!err) {
        if (rows.length > 0) {
          res.render("edit-categoria", {
            rows,
            error: `Categoria ${descricao} já existe !.`,
          });
          return;
        } else {
          // Categorias the connection
          connection.query(
            "UPDATE categorias SET descricao = ? WHERE 1=1 AND status='active' AND id = ?",
            [descricao, req.params.id],
            (err, rows) => {
              if (!err) {
                res.render("edit-categoria", {
                  alert: `${descricao} foi alterada.`,
                });
              } else {
                res.render("edit-categoria", {
                  rows,
                  error: err.sqlMessage,
                });
              }
              console.log("The data from categorias table: \n", rows);
            }
          );
        }
      } else {
        res.render("edit-categoria", {
          error: err.sqlMessage,
        });
      }
      console.log("The data from categorias table: \n", rows);
    }
  );
};

// Delete Categoria
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
    `SELECT COUNT(*) FROM lancamentos WHERE cat_id = ?;`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        if (rows[0]["COUNT(*)"] > 0) {
          res.render("view-categoria", {
            error: `Impossível excluír Categoria ID ${req.params.id}. Falha de integridade !.`,
          });
          return;
        } else {
          connection.query(
            "SELECT descricao FROM categorias WHERE 1=1 AND status='active' AND id = ?; UPDATE categorias SET status = ? WHERE 1=1 AND status = 'active' AND id = ?;",
            [req.params.id, "removed", req.params.id],
            (err, rows) => {
              if (!err) {
                let removedCategoria = encodeURIComponent(
                  `Categoria ${rows[0][0].descricao} foi removida.`
                );
                res.redirect("/categoria/?removed=" + removedCategoria);
              } else {
                res.render("view-categoria", {
                  rows,
                  error: err.sqlMessage,
                });
              }
            }
          );
        }
      } else {
        res.render("view-categoria", {
          error: err.sqlMessage,
        });
      }
      console.log("The data from beer table are: \n", rows);
    }
  );
};

// View Categorias
exports.viewall = (req, res) => {
  // Categorias the connection
  connection.query(
    "SELECT * FROM categorias WHERE 1=1 AND status = 'active' AND id = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("view-categoria", { rows });
      } else {
        console.log(err);
      }
      console.log("The data from categorias table: \n", rows);
    }
  );
};
