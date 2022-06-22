const mongoose = require('mongoose');

const PPDSchema = new mongoose.Schema({
        geral: {
          nomePPD: String,
          mencaoResp: String,
          entSel: Array,
          fonteLegitimacao: {
            id: String,
            titulo: String
          },
          tipoFonteL: String
        },
        sistemasInfo: Array
})

module.exports = mongoose.model('PPD', PPDSchema, 'ppd');
