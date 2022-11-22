const mongoose = require("mongoose");

const AutoSchema = new mongoose.Schema({
  codigoPedido: {
    type: String,
    index: true,
    match: /\d{4}-\d{1,}/,
    required: true,
    },
  dataAprovacao: {
    type: Date,
    default: Date.now,
    required: true,
  },
  dados: {
    type: Object,
    required: true,
  }
});

module.exports = mongoose.model("Auto", AutoSchema, "autos");
