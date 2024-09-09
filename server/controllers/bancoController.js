const session = require("express-session");

// View Banco
exports.view = async (req, res) => {
  // bancos the connection
  const { fpool } = require("../../db");

  const pool = await fpool(req.session.user_id)

  if(!pool) {
    res.render("lancamento", {error: `Erro: 500 Internal Server Error !`})
  }

  pool.getConnection(async function (err, conn) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }

    console.log("connected as id " + conn.threadId);

    await conn.query(
      'SELECT id, nome, FORMAT(saldo_anterior,2,"de_DE") saldo_anterior, FORMAT(saldo,2,"de_DE") fsaldo, saldo FROM bancos WHERE 1=1 AND  status = "active" ORDER BY nome',
      (err, rows) => {
        // When done with the connection, release it
        if (!err) {
          let total = 0;
          let removedBanco = req.query.removed;
          rows.forEach((element) => {
            total = total + parseFloat(element.saldo);
          });
          total = total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

          res.render("banco", {
            rows,
            removedBanco,
            total,
            session: req.session,
          });
        } else {
          res.render("banco", { error: err.sqlMessage, session: req.session });
        }
        console.log("The data from bancos table: \n", rows);
        conn.release();
      }
    );
  });
};

// Find Banco by Search
exports.find = async (req, res) => {
  let searchTerm = req.body.search;
  // User the connection
  const { fpool } = require("../../db");

  const pool = await fpool(req.session.user_id)

  if(!pool) {
    res.render("lancamento", {error: `Erro: 500 Internal Server Error !`})
  }

  pool.getConnection(async function (err, conn) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }

    console.log("connected as id " + conn.threadId);

    await conn.query(
      'SELECT id, nome, FORMAT(saldo_anterior,2,"de_DE") saldo_anterior, FORMAT(saldo,2,"de_DE") saldo FROM bancos WHERE 1=1 AND  status = "active" AND nome LIKE ? ',
      ["%" + searchTerm + "%"],
      (err, rows) => {
        if (!err) {
          res.render("banco", { rows, session: req.session });
        } else {
          res.render("banco", { error: err.sqlMessage, session: req.session });
        }
        console.log("The data from bancos table: \n", rows);
        conn.release();
      }
    );
  });
};

exports.form = async (req, res) => {
  res.render("add-banco", { session: req.session });
};

// Add new banco
exports.create = async (req, res) => {
  let { nome, saldo_anterior, saldo } = req.body;
  let erro_msg;

  if (nome.length < 1) {
    res.render("add-banco", {
      error: "Nome não informado.",
      session: req.session,
    });
    return;
  }

  let searchTerm = req.body.search;
  saldo = saldo === "" ? 0 : saldo;
  saldo_anterior = saldo_anterior === "" ? 0 : saldo_anterior;

  // verica se já existe
  const { fpool } = require("../../db");

  const pool = await fpool(req.session.user_id)

  if(!pool) {
    res.render("lancamento", {error: `Erro: 500 Internal Server Error !`})
  }

  pool.getConnection(async function (err, conn) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }

    console.log("connected as id " + conn.threadId);

    await conn.query(
      `SELECT * FROM bancos WHERE 1=1 AND  nome = ? AND status = "active";`,
      [nome],
      (err, rows) => {
        if (rows.length > 0) {
          res.render("add-banco", {
            error: nome + " já existe !",
            session: req.session,
          });
          return;
        } else {
          // bancos the connection
          conn.query(
            "INSERT INTO bancos SET nome = ?, saldo_anterior = ?, saldo = ?",
            [nome, saldo_anterior, saldo],
            (err, rows) => {
              if (!err) {
                res.render("add-banco", {
                  alert: `Banco ${nome} adicionado com sucesso !.`,
                  session: req.session,
                });
              } else {
                res.render("add-banco", {
                  error: err.sqlMessage,
                  session: req.session,
                });
              }
              console.log("The data from bancos table: \n", rows);
              conn.release();
            }
          );
        }
      }
    );
  });
};

// Edit banco
exports.edit = async (req, res) => {
  // bancos the connection
  const { fpool } = require("../../db");

  const pool = await fpool(req.session.user_id)

  if(!pool) {
    res.render("lancamento", {error: `Erro: 500 Internal Server Error !`})
  }

  pool.getConnection(async function (err, conn) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }

    console.log("connected as id " + conn.threadId);

    await conn.query(
      "SELECT * FROM bancos WHERE 1=1 AND  id = ? AND status = 'active'",
      [req.params.id],
      (err, rows) => {
        if (!err) {
          res.render("edit-banco", { rows, session: req.session });
        } else {
          res.render("edit-banco", {
            rows,
            error: err.sqlMessage,
            session: req.session,
          });
        }
        console.log("The data from bancos table: \n", rows);
        conn.release();
      }
    );
  });
};

// Update Banco
exports.update = async (req, res) => {
  const { nome, saldo_anterior, saldo } = req.body;

  if (nome.length < 1) {
    res.render("edit-banco", {
      error: "Nome não informado.",
      session: req.session,
    });
    return;
  }

  // bancos the connection
  const { fpool } = require("../../db");

  const pool = await fpool(req.session.user_id)

  if(!pool) {
    res.render("lancamento", {error: `Erro: 500 Internal Server Error !`})
  }

  pool.getConnection(async function (err, conn) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }

    console.log("connected as id " + conn.threadId);

    await conn.query(
      "SELECT * FROM bancos WHERE 1=1 AND  nome = ? AND status = 'active' AND id <> ?",
      [nome, req.params.id],
      (err, rows) => {
        // When done with the connection, release it

        if (!err) {
          if (rows.length > 0) {
            res.render("edit-banco", {
              rows,
              error: nome + " já existe !",
              session: req.session,
            });
            return;
          } else {
            // bancos the connection
            conn.query(
              "UPDATE bancos SET nome = ?, saldo_anterior = ?, saldo = ? WHERE 1=1 AND  id = ? AND status = 'active'",
              [nome, saldo_anterior, saldo, req.params.id],
              (err, rows) => {
                if (!err) {
                  res.render("edit-banco", {
                    // rows,
                    alert: `${nome} foi atualizado.`,
                    session: req.session,
                  });
                } else {
                  res.render("edit-banco", {
                    rows,
                    error: err.sqlMessage,
                    session: req.session,
                  });
                }
                console.log("The data from bancos table: \n", rows);
                conn.release();
              }
            );
          }
        } else {
          res.render("edit-banco", {
            rows,
            error: err.sqlMessage,
            session: req.session,
          });
        }
        console.log("The data from bancos table: \n", rows);
      }
    );
  });
};

// Delete Banco
exports.delete = async (req, res) => {
  // Delete a record

  // User the connection
  // await  connection.query('DELETE FROM user WHERE 1=1 AND  id = ?', [req.params.id], (err, rows) => {

  //   if(!err) {
  //     res.redirect('/');
  //   } else {
  //     console.log(err);
  //   }
  //   console.log('The data from user table: \n', rows);

  // });

  // Hide a record

  // Veifica integridade
  const { fpool } = require("../../db");

  const pool = await fpool(req.session.user_id)

  if(!pool) {
    res.render("lancamento", {error: `Erro: 500 Internal Server Error !`})
  }

  pool.getConnection(async function (err, conn) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }

    console.log("connected as id " + conn.threadId);

    await conn.query(
      `SELECT COUNT(*) FROM lancamentos WHERE banco_id = ?;`,
      [req.params.id],
      (err, rows) => {
        if (!err) {
          if (rows[0]["COUNT(*)"] > 0) {
            res.render("view-banco", {
              error: `Impossível excluír Banco ID ${req.params.id}. Falha de integridade !.`,
              session: req.session,
            });
            return;
          } else {
            conn.query(
              "SELECT nome FROM bancos WHERE 1=1 AND  id = ? AND status = 'active'; UPDATE bancos SET status = ? WHERE 1=1 AND  id = ?;",
              [req.params.id, "removed", req.params.id],
              (err, rows) => {
                if (!err) {
                  let removedBanco = encodeURIComponent(
                    `Banco ${rows[0][0].nome} foi removido.`
                  );
                  res.redirect("/banco/?removed=" + removedBanco);
                } else {
                  res.render("view-banco", {
                    rows,
                    error: err.sqlMessage,
                    session: req.session,
                  });
                }
                console.log("The data from beer table are: \n", rows);
              }
            );
          }
        } else {
          res.render("view-banco", {
            error: err.sqlMessage,
            session: req.session,
          });
        }
        console.log("The data from beer table are: \n", rows);
        conn.release();
      }
    );
  });
};

// View bancos
exports.viewall = async (req, res) => {
  // bancos the connection
  const { fpool } = require("../../db");

  const pool = await fpool(req.session.user_id)

  if(!pool) {
    res.render("lancamento", {error: `Erro: 500 Internal Server Error !`})
  }

  pool.getConnection(async function (err, conn) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }

    console.log("connected as id " + conn.threadId);

    await conn.query(
      'SELECT id, nome, FORMAT(saldo_anterior,2,"de_DE") saldo_anterior, FORMAT(saldo,2,"de_DE") saldo FROM bancos WHERE 1=1 AND  id = ?',
      [req.params.id],
      (err, rows) => {
        if (!err) {
          res.render("view-banco", { rows, session: req.session });
        } else {
          res.render("view-banco", {
            rows,
            error: err.sqlMessage,
            session: req.session,
          });
        }
        console.log("The data from bancos table: \n", rows);
        conn.release();
      }
    );
  });
};
