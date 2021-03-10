const mongoose = require('mongoose');

const PPDSchema = new mongoose.Schema({
        nomePlano: String,
        dataPlano: {
          type: Date,
          default: Date.now,
          required: true
        },
        identificacao: {
          nRefSI: {
              type: String,
              required: true,
          },
          nomeSI: String,
          nomeAdmin: String,
          proprietario: String
        },
        avaliacao: {
          nRefSI: {
              type: String,
              required: true,
          },
          codigoClass: String,
          tituloClass : String,
          descricao: String
        },
        caracterizacao: {
          nRefSI: {
              type: String,
              required: true,
          },
          nomeSI: String,
          nivelDependencia: String
        }
})

module.exports = mongoose.model('PPD', PPDSchema, 'ppds');
