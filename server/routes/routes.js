const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();
const userController = require('../controllers/userController');
const categoriaController = require('../controllers/categoriaController');
const pessoaController = require('../controllers/pessoaController');
const bancoController = require('../controllers/bancoController');
const lancaController = require('../controllers/lancaController');
const opeController = require('../controllers/opeController');
const suporteController = require('../controllers/suporteController');

// Routes

// Lançamentos
router.get('/lanca', lancaController.view);
router.post('/lanca', lancaController.find);
router.get('/addlanca', lancaController.form);
router.post('/addlanca', lancaController.create);
router.get('/editlanca/:id', lancaController.edit);
router.post('/editlanca/:id', lancaController.update);
router.get('/viewlanca/:id', lancaController.viewall);
router.get('/dellanca/:id',lancaController.delete); 
router.get('/baixarlanca/:id',lancaController.baixar); 
router.get('/rellancamentos',lancaController.rellancamentos); 
router.post('/rellancamentos',lancaController.print); 
router.post('/print',lancaController.print); 


// Bancos
router.get('/banco', bancoController.view);
router.post('/banco', bancoController.find);
router.get('/addbanco', bancoController.form);
router.post('/addbanco', bancoController.create);
router.get('/editbanco/:id', bancoController.edit);
router.post('/editbanco/:id', bancoController.update);
router.get('/viewbanco/:id', bancoController.viewall);
router.get('/delbanco/:id',bancoController.delete); 

// Categorias
router.get('/categoria', categoriaController.view);
router.post('/categoria', categoriaController.find);
router.get('/addcategoria', categoriaController.form);
router.post('/addcategoria', categoriaController.create);
router.get('/editcategoria/:id', categoriaController.edit);
router.post('/editcategoria/:id', categoriaController.update);
router.get('/viewcategoria/:id', categoriaController.viewall);
router.get('/delcategoria/:id',categoriaController.delete);

// Pessoas
router.get('/pessoa', pessoaController.view);
router.post('/pessoa', pessoaController.find);
router.get('/addpessoa', pessoaController.form);
router.post('/addpessoa', pessoaController.create);
router.get('/editpessoa/:id', pessoaController.edit);
router.post('/editpessoa/:id', pessoaController.update);
router.get('/viewpessoa/:id', pessoaController.viewall);
router.get('/delpessoa/:id',pessoaController.delete);

router.get('/user', userController.view);
router.post('/user', userController.find);
router.get('/adduser', userController.form);
router.post('/adduser', userController.create);
router.get('/edituser/:id', userController.edit);
router.post('/edituser/:id', userController.update);
router.get('/viewuser/:id', userController.viewall);
router.get('/deluser/:id',userController.delete);
// router.post('/login',authController.login);

// Operações
router.get('/ope', opeController.view);
router.post('/ope', opeController.find);
router.get('/addope', opeController.form);
router.post('/addope', opeController.create);
router.get('/editope/:id', opeController.edit);
router.post('/editope/:id', opeController.update);
router.get('/viewope/:id', opeController.viewall);
router.get('/delope/:id',opeController.delete); 

router.get('/backup',suporteController.backup);

router.get('/',(req, res, next) => {
  // console.log(req.session)
  res.render('home', {
    user: req.user,
    dbName: process.env.DB_NAME,
    session: req.session
  });
});

router.get('/login',(req, res) => {
  var user_name = process.env.USER_NAME
  var pass_word = process.env.PASSWD
  res.render('login', {user_name, pass_word});
});

module.exports = router;