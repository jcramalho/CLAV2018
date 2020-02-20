const mongoose = require("mongoose");

const PedidoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    index: true,
    match: /\d{4}-\d{1,}/,
    required: true
  },
  estado: {
    type: String,
    required: true
  },
  data: {
    type: Date,
    default: Date.now,
    required: true
  },
  criadoPor: {
    type: String,
    required: true
  },
  objeto: {
    codigo: {
      type: String,
      required: false
    },
    dados: {
      type: Object
    },
    tipo: {
      type: String,
      enum: [
        "Classe",
        "TS Organizacional",
        "TS Pluriorganizacional",
        "TS Pluriorganizacional web",
        "Entidade",
        "Tipologia",
        "Legislação",
        "Termo de Indice",
        "Auto de Eliminação",
        "AE PGD/LC",
        "AE PGD",
        "AE RADA",
        "RADA"
      ],
      required: true
    },
    acao: {
      type: String,
      enum: [
        "Criação",
        "Alteração",
        "Remoção",
        "Importação",
        "Extinção",
        "Revogação"
      ],
      required: true
    }
  },
  distribuicao: [
    {
      estado: {
        type: String,
        enum: ["Submetido", "Distribuído", "Apreciado", "Validado"],
        required: true
      },
      responsavel: {
        type: String // Email do técnico responsável pelo pedido neste estado
      },
      data: {
        type: Date,
        default: Date.now,
        required: true
      },
      despacho: {
        type: String
      }
    }
  ],
  entidade: {
    type: String,
    required: false
  }
});

PedidoSchema.pre("validate", async function(next) {
  if (!this.codigo) {
    let count = await mongoose.model("Pedido").count();
    this.codigo = `${new Date().getFullYear()}-${count}`;
  }
  next();
});

PedidoSchema.methods.sparqlQuery = function() {
  console.log(JSON.stringify(this));
  const rdf_types = {
    Entidade: "clav:Entidade",
    Legislação: "clav:Legislacao",
    "Termo de Indice": "clav:TermoIndice",
    Tipologia: "clav:TipologiaEntidade",
    "Auto de Eliminacao": "clav:AutoEliminacao"
  };
  const rdf_type = rdf_types[this.objeto.tipo];
  let query = "";

  if (this.objeto.acao === "Criação") {
    query = `INSERT DATA {
            ${this.objeto.codigo} rdf:type owl:NamedIndividual, ${rdf_type} .
            ${this.objeto.triplos
              .map(
                triplo =>
                  `${triplo.sujeito} ${triplo.predicado} ${triplo.objeto}; `
              )
              .join("\n")}
        }`;
  } else if (this.objeto.acao === "Edição") {
    query = `DELETE {
        } WHERE {
        } INSERT {
        }`;
  } else if (this.objeto.acao === "Remoção") {
  }

  return query;
};

module.exports = mongoose.model("Pedido", PedidoSchema, "pedidos");
