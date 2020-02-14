const mongoose = require("mongoose");

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
  objeto: {
    type: Object
  },
  tipo: {
    type: String,
    enum: [
      "Classe",
      "TS Organizacional",
      "TS Pluriorganizacional",
      "Entidade",
      "Tipologia",
      "Legislação",
      "Termo de Indice",
      "Auto de Eliminação"
    ],
    required: true
  },
  acao: {
    type: String,
    enum: ["Criação", "Alteração", "Remoção", "Extinção"],
    required: true
  }
});

module.exports = mongoose.model("Pendente", PendenteSchema, "pendentes");
