// importando os packages que precisamos
require('dotenv').config();
const mongoose = require('mongoose')
const Schema = mongoose.Schema
// const bcrypt = require('bcryptjs')

// schema
const ClientesSchema = new Schema({
  dbname: String,
  username: String,
  senha: String,
  nome: {
    type: String,
    required: true,
    // select: false
  },
  endpoint: String,
  dbusername: String,
  dbsenha: String,
})

// exportando a entidade
module.exports = mongoose.model('Clientes', ClientesSchema)