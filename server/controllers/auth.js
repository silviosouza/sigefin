// require("dotenv").config();
const session = require("express-session");
const jwt = require("jsonwebtoken"); //importando jwt
const bcrypt = require("bcryptjs"); //importando bcrypt
const { promisify } = require("util"); //importando promisify
const mongoose = require("mongoose"); // para trabalhar com nossa database
const Clientes = require("../models/Clientes");
const path = require("path");

const HandyStorage = require("handy-storage");
const { decode } = require("punycode");

const storage = new HandyStorage({
  beautify: true,
});

const storage_cliente = new HandyStorage({
  beautify: true,
});

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_DB_URI);

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

      const id = clientes._id.toString();

      process.env.DB_NAME = clientes.dbname;

      storage_cliente.connect(path.join("./public", `${id}.json`));

      storage_cliente.setState({ empresa: clientes.nome });
      storage_cliente.setState({ username: usuario });

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
      req.session.dbname = clientes.nome;
      // console.log(req.session)
      res.render("home", { session: req.session });
      // res.status(200).redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
};

//funcao para logar o user
exports.isLoggedIn = async (req, res, next) => {
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
      //1)verificar o token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      //2)check se o usuário existe
      const user = await Clientes.findOne({ _id: decoded.id });
      if (!user) {
        res.status(200).redirect("/");
      }

      req.user = user;
      req.session.user_id = decoded.id;
      req.session.dbname = user.nome;
      return next();
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    res.status(200).redirect("/");
  }
};
//
exports.logout = async (req, res) => {
  var fs = require("fs");

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
    //1)verificar o token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    var usr_id = req.session.user_id || decoded.id,
      jsonfile;

    if (usr_id) {
      jsonfile = path.join("./public", `${usr_id}.json`);
      //sobrescrevendo o cookie
      fs.unlink(jsonfile, function (err) {
        if (err) throw err;
        console.log(`Arquivo [${jsonfile}] deletado!`);
      });
    }
  }

  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2 * 1000), //cookie expiration time
    httpOnly: true,
  });

  req.session.destroy();
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
