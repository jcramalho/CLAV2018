const mongoose = require("mongoose");
var vcPendenteTipo = require('../routes/validation').vcPendenteTipo
var vcPendenteAcao = require('../routes/validation').vcPendenteAcao

const PendenteSchema = new mongoose.Schema({
  dataCriacao: {
    type: Date,
    default: Date.now,
    required: true
  },
  dataAtualizacao: {
    type: Date,
    default: Date.now,
    required: true
  },
  numInterv: {
    type: Number,
    required: true
  },
  criadoPor: {
    type: String, // Email do utilizador que criou o pedido
    required: true
  },
  entidade: {
    type: String, // Entidade do utilizador que criou o pedido
    required: true
  },
  objeto: {
    type: Object
  },
  tipo: {
    type: String,
    enum: vcPendenteTipo,
    required: true
  },
  acao: {
    type: String,
    enum: vcPendenteAcao,
    required: true
  }
});

module.exports = mongoose.model("Pendente", PendenteSchema, "pendentes");
