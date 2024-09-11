// importando os packages que precisamos
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const bcrypt = require('bcryptjs')

// schema
const ClientesSchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
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
  },
  {
    bufferCommands: false,
  }
);

// exportando a entidade
module.exports = mongoose.model("Clientes", ClientesSchema);
