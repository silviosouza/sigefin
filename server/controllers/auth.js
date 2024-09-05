const mysql = require("mysql"); //importando mysql
const jwt = require("jsonwebtoken"); //importando jwt
const bcrypt = require("bcryptjs"); //importando bcrypt
const { promisify } = require("util"); //importando promisify
const mongoose = require("mongoose"); // para trabalhar com nossa database
const Clientes = require("../models/Clientes");
const mongo_db_uri = process.env.MONGO_DB_URI;
const path = require("path");

const HandyStorage = require("handy-storage");

const storage = new HandyStorage({
  beautify: true,
});

storage.connect(path.join("./public", "db.json"));

const storage_cliente = new HandyStorage({
  beautify: true,
});

storage_cliente.connect(path.join("./public", "cliente.json"));

mongoose.set("strictQuery", true);
mongoose.connect(mongo_db_uri);

exports.login = async (req, res) => {
  //codicoes da para logar o user
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).render("login", {
        alert: "Digite o usuário e a senha",
      });
    }

    // MONGO_DB
    const clientes = await Clientes.findOne({ username: usuario });

    if (
      clientes === null ||
      !(await bcrypt.compare(password, clientes.senha))
    ) {
      res.status(401).render("login", {
        error: "Usuário ou senha está incorreta",
      });
    } else {
      process.env.NOME_EMPRESA = clientes.nome;

      storage.setState({ dbname: clientes.dbname });
      storage.setState({ dbusername: clientes.dbusername });
      storage.setState({ endpoint: clientes.endpoint });
      storage.setState({ dbsenha: clientes.dbsenha });

      storage_cliente.setState({ empresa: clientes.nome });
      storage_cliente.setState({ username: usuario });

      const id = clientes._id.toString();

      //criando token para a session
      const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const cookieOptions = {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000 //
        ),
        httpOnly: true,
      };
      //setando o cookie no browser
      res.cookie("jwt", token, cookieOptions);
      req.session.user_id = id;
      // console.log(req.session)
      res.status(200).redirect("/");
    }

    //colocando os valores da coneceção mysql
    /* const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});


        db.query('SELECT * FROM user WHERE name = ?', [usuario], async (error, results) => {
            if(!results || !(await bcrypt.compare(password,results[0].password))){
                res.status(401).render('login', {
                    error: 'Usuário ou senha está incorreta'
                })
            } else {
                const id = results[0].id;
                console.log("id <<<<<<<<<<<<")
                console.log(id)
                //criando token para a session
                const token = jwt.sign({id: id},process.env.JWT_SECRET,{
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                // console.log("the token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000 //
                    ),
                    httpOnly: true
                }
                //setando o cookie no browser
                res.cookie('jwt', token, cookieOptions);
                req.session.user_id = id;
                res.status(200).redirect('/');

            }
        }) */
  } catch (error) {
    console.log(error);
  }
};

//funcao para logar o user
exports.isLoggedIn = async (req, res, next) => {
  // console.log(`req.get("cookie") >>>>>>>>>> ${req.get("cookie")}`)
  console.log(`req.headers.cookie >>>>>>>>>> ${req.headers.cookie}`)
  const myCookieInteiro = req.headers.cookie;
  var token;
  if (myCookieInteiro !== undefined) {
    const arCookie = myCookieInteiro.includes(";")
      ? myCookieInteiro.split(";")
      : [myCookieInteiro];
// console.log()
    arCookie.forEach((element) => {
      if (element.includes("jwt=")) {
        token = element.substring(element.search("=") + 1);
      }
    });
  }
  if (token !== undefined && token.length > 1) {
    try {
      console.log(token);
      //1)verificar o token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      // console.log(decoded)

      //2)check se o usuário existe
      const user = await Clientes.findOne({ _id: decoded.id });
      if (!user) {
        // return next();
        res.status(200).redirect("/");
      }

      req.user = user;
      req.session.user_id = decoded.id;
      return next();

      /*          db.query('SELECT * FROM user WHERE id = ?',[decoded.id],(error,result) => {

                if(!result) {
                    return next();
                } 

                req.user = result[0];
                return next();
            }); */
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    // console.log('>>>>>>>> next()');
    // next();
    res.status(200).redirect("/");
  }
};
//
exports.logout = async (req, res) => {
  //sobrescrevendo o cookie
  var fs = require("fs");
  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2 * 1000), //cookie expiration time
    httpOnly: true,
  });
  req.session.destroy();
  //  console.log("Logout")
  //  Apaga arquivo db.json
  fs.unlink(path.join("./public", "db.json"), function (err) {
    if (err) throw err;
    console.log("Arquivo [db.json] deletado!");
  });
  fs.unlink(path.join("./public", "cliente.json"), function (err) {
    if (err) throw err;
    console.log("Arquivo [cliente.json] deletado!");
  });
  res.status(200).redirect("/"); //redirecionando o user para home
};

//Funcão para registrar o user
exports.register = (req, res) => {
  console.log(req.body);

  const { name, email, password, passwordConfirm } = req.body;

  db.query(
    "SELECT email FROM user WHERE email = ?",
    [email],
    async (error, result) => {
      //Checando erros e redudancia
      if (error) {
        console.log(error);
      }
      if (result.length > 0) {
        return res.render("register", {
          message: "Esse email já está cadastrado",
        });
      } else if (password !== passwordConfirm) {
        return res.render("register", {
          message: "A senha não compativeis",
        });
      }

      //criptogrando a senha
      let hashedPassword = await bcrypt.hash(password, 8);
      console.log(hashedPassword);

      //inserindo os dados no banco de dados
      db.query(
        "INSERT INTO user SET ?",
        { name: name, email: email, password: hashedPassword },
        (error, result) => {
          if (error) {
            console.log(error);
          } else {
            return res.render("register", {
              alert: "Usuário Registrado",
            });
          }
        }
      );
    }
  );
};
