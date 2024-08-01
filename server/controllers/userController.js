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
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // Máximo de conexões inativas; o valor padrão é o mesmo que "connectionLimit"
  idleTimeout: 60000, // Tempo limite das conexões inativas em milissegundos; o valor padrão é "60000"
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000
});


// View Users
exports.view = async  (req, res) => {
  // User the connection
  await connection.query(
    'SELECT * FROM user WHERE 1=1 AND status = "active" AND id > 0',
    (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let removedUser = req.query.removed;
        res.render("user", { rows, removedUser, session : req.session });
      } else {
        res.render("user", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from user table: \n", rows);
    }
  );
  // connection.end();
};

// Find User by Search
exports.find = async  (req, res) => {
  let searchTerm = req.body.search;
  // User the connection
  await connection.query(
    "SELECT * FROM user WHERE 1=1 AND  name LIKE ? AND status = 'active'",
    ["%" + searchTerm + "%"],
    (err, rows) => {
      if (!err) {
        res.render("user", { rows, session : req.session });
      } else {
        res.render("user", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from user table: \n", rows);
    }
  );
  // connection.end();
};

exports.form = async  (req, res) => {
  res.render("add-user", {session : req.session});
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
    res.render("add-user", { error: "Favor preencher todos os campos", session : req.session });
    return;
  }

  let cryptpassword = await bcrypt.hash(password, 8);
  console.log(password, cryptpassword);

  // verica se já existe
  await connection.query(
    `SELECT * FROM user WHERE 1=1 AND (email = ? OR name = ?) AND status = "active";`,
    [email, name],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {
          res.render("add-user", {
            error: `${name} e/ou ${email} já existe !`, session : req.session
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
                  alert: `Usuário ${name} adicionado com sucesso.`, session : req.session
                });
              } else {
                console.log(err);
                res.render("add-user", { error: err.sqlMessage, session : req.session });
              }
            }
          );
        }
      } else {
        res.render("add-user", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from user table: \n", rows);
    }
  );
  // connection.end();
};

// Edit user
exports.edit = async  (req, res) => {
  // User the connection
  await connection.query(
    "SELECT * FROM user WHERE 1=1 AND  id = ? AND status = 'active';",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("edit-user", { rows, session : req.session });
      } else {
        res.render("user", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from user table: \n", rows);
    }
  );
  // connection.end();
};

// Update User
exports.update = async  (req, res) => {
  const { name, password, email } = req.body;
  console.log(name, password, email)
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (
    name.length < 3 ||
    !emailRegexp.test(email) ||
    !password ||
    password.length < 8
  ) {
    res.render("edit-user", { error: "Favor preencher todos os campos", session : req.session });
    return;
  }

  let cryptpassword = await bcrypt.hash(password, 8);
  // console.log(password, cryptpassword);

  // User the connection
  await connection.query(
    "SELECT * FROM user WHERE 1=1 AND status='active' AND name = ? AND id <> ?",
    [name, req.params.id],
    (err, rows) => {
      // When done with the connection, release it

      if (!err) {
        if (rows.length > 0) {
          rows,
            res.render("edit-user", { error: `Usuário ${name} já existe !.`, session : req.session });
          return;
        } else {
          // User the connection
          connection.query(
            "UPDATE user SET name = ?, password = ?, email = ? WHERE 1=1 AND id = ? AND status='active'",
            [name, cryptpassword, email, req.params.id],
            (err, rows) => {
              if (!err) {
                res.render("edit-user", {
                  // rows,
                  alert: `${name} foi atualizado.`, session : req.session
                });
              } else {
                res.render("edit-user", { error: err.sqlMessage, session : req.session });
              }
            }
          );
        }
      } else {
        res.render("edit-user", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from user table: \n", rows);
    }
  );
  // connection.end();
};

// Delete User
exports.delete = async  (req, res) => {
  // Delete a record

  // User the connection
  // await connection.query('DELETE FROM user WHERE 1=1 AND  id = ?', [req.params.id], (err, rows) => {

  //   if(!err) {
  //     res.redirect('/');
  //   } else {
  //           res.render('user', { error: err.sqlMessage });;
  //   }
  //   console.log('The data from user table: \n', rows);

  // });

  // Hide a record

  await connection.query(
    "SELECT name FROM user WHERE 1=1 AND  id = ?; UPDATE user SET status = ? WHERE 1=1 AND  id = ?;",
    [req.params.id, "removed", req.params.id],
    (err, rows) => {
      if (!err) {
        let removedUser = encodeURIComponent(
          `Usuário ${rows[0][0].name} foi removido.`
        );
        res.redirect("/user?removed=" + removedUser);
      } else {
        res.render("user", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from beer table are: \n", rows);
    }
  );
  // connection.end();
};

// View Users
exports.viewall = async  (req, res) => {
  // User the connection
  await connection.query(
    "SELECT * FROM user WHERE 1=1 AND status='active' AND id = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("view-user", { rows, session : req.session });
      } else {
        res.render("user", { error: err.sqlMessage, session : req.session });
      }
      console.log("The data from user table: \n", rows);
    }
  );
  // connection.end();
};


// Login
/* exports.login = async (req, res) => {
  const {usuario, password} = req.body;
  res.render('login', {alert: `Olá ${usuario} - ${password}`})
} */
