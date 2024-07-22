const mysql = require("mysql");
const bcrypt = require("bcryptjs");

// Connection Pool
let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true,
});

// View Users
exports.view = (req, res) => {
  // User the connection
  connection.query(
    'SELECT * FROM user WHERE 1=1 AND  status = "active"',
    (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let removedUser = req.query.removed;
        res.render("user", { rows, removedUser });
      } else {
        res.render("user", { error: err.sqlMessage });
      }
      console.log("The data from user table: \n", rows);
    }
  );
};

// Find User by Search
exports.find = (req, res) => {
  let searchTerm = req.body.search;
  // User the connection
  connection.query(
    "SELECT * FROM user WHERE 1=1 AND  name LIKE ? AND status = 'active'",
    ["%" + searchTerm + "%"],
    (err, rows) => {
      if (!err) {
        res.render("user", { rows });
      } else {
        res.render("user", { error: err.sqlMessage });
      }
      console.log("The data from user table: \n", rows);
    }
  );
};

exports.form = (req, res) => {
  res.render("add-user");
};

// Add new user
exports.create = async (req, res) => {
  const { name, email, password } = req.body;
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (
    name.length < 3 ||
    !emailRegexp.test(email) ||
    !password ||
    password.length < 8
  ) {
    res.render("add-user", { error: "Please fill all the fields" });
    return;
  }

  let cryptpassword = await bcrypt.hash(password, 8);
  console.log(password, cryptpassword);

  // verica se já existe
  connection.query(
    `SELECT * FROM user WHERE 1=1 AND (email = ? OR name = ?) AND status = "active";`,
    [email, name],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {
          res.render("add-user", {
            error: `${name} e/ou ${email} já existe !`,
          });
          return;
        } else {
          // User the connection

          connection.query(
            "INSERT INTO user SET name = ?, password = ?, email = ?",
            [name, cryptpassword, email],
            (err, rows) => {
              if (!err) {
                res.render("add-user", {
                  alert: `Usuário ${name} adicionado com sucesso.`,
                });
              } else {
                console.log(err);
                res.render("add-user", { error: err.sqlMessage });
              }
            }
          );
        }
      } else {
        res.render("add-user", { error: err.sqlMessage });
      }
      console.log("The data from user table: \n", rows);
    }
  );
};

// Edit user
exports.edit = (req, res) => {
  // User the connection
  connection.query(
    "SELECT * FROM user WHERE 1=1 AND  id = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("edit-user", { rows });
      } else {
        res.render("user", { error: err.sqlMessage });
      }
      console.log("The data from user table: \n", rows);
    }
  );
};

// Update User
exports.update = (req, res) => {
  const { name, password, email } = req.body;
  // User the connection
  connection.query(
    "SELECT * FROM user WHERE 1=1 AND status='active' AND name = ? AND id <> ?",
    [name, req.params.id],
    (err, rows) => {
      // When done with the connection, release it

      if (!err) {
        if (rows.length > 0) {
          rows,
            res.render("edit-user", { error: `Usuário ${name} já existe !.` });
          return;
        } else {
          // User the connection
          connection.query(
            "UPDATE user SET name = ?, password = ?, email = ? WHERE 1=1 AND id = ? AND status='active'",
            [name, password, email, req.params.id],
            (err, rows) => {
              if (!err) {
                res.render("edit-user", {
                  // rows,
                  alert: `${name} foi atualizado.`,
                });
              } else {
                res.render("edit-user", { error: err.sqlMessage });
              }
            }
          );
        }
      } else {
        res.render("edit-user", { error: err.sqlMessage });
      }
      console.log("The data from user table: \n", rows);
    }
  );
};

// Delete User
exports.delete = (req, res) => {
  // Delete a record

  // User the connection
  // connection.query('DELETE FROM user WHERE 1=1 AND  id = ?', [req.params.id], (err, rows) => {

  //   if(!err) {
  //     res.redirect('/');
  //   } else {
  //           res.render('user', { error: err.sqlMessage });;
  //   }
  //   console.log('The data from user table: \n', rows);

  // });

  // Hide a record

  connection.query(
    "SELECT name FROM user WHERE 1=1 AND  id = ?; UPDATE user SET status = ? WHERE 1=1 AND  id = ?;",
    [req.params.id, "removed", req.params.id],
    (err, rows) => {
      if (!err) {
        let removedUser = encodeURIComponent(
          `Usuário ${rows[0][0].name} foi removido.`
        );
        res.redirect("/user?removed=" + removedUser);
      } else {
        res.render("user", { error: err.sqlMessage });
      }
      console.log("The data from beer table are: \n", rows);
    }
  );
};

// View Users
exports.viewall = (req, res) => {
  // User the connection
  connection.query(
    "SELECT * FROM user WHERE 1=1 AND status='active' AND id = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("view-user", { rows });
      } else {
        res.render("user", { error: err.sqlMessage });
      }
      console.log("The data from user table: \n", rows);
    }
  );
};
