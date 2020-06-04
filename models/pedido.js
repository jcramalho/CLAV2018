const mongoose = require("mongoose");
var vcPedidoTipo = require("../routes/validation").vcPedidoTipo;
var vcPedidoAcao = require("../routes/validation").vcPedidoAcao;
var vcPedidoEstado = require("../routes/validation").vcPedidoEstado;

const PedidoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    index: true,
    match: /\d{4}-\d{1,}/,
    required: true,
  },
  estado: {
    type: String,
    required: true,
  },
  data: {
    type: Date,
    default: Date.now,
    required: true,
  },
  criadoPor: {
    type: String,
    required: true,
  },
  objeto: {
    codigo: {
      type: String,
      required: false,
    },
    dados: {
      type: Object,
    },
    dadosOriginais: {
      type: Object,
    },
    tipo: {
      type: String,
      enum: vcPedidoTipo,
      required: true,
    },
    acao: {
      type: String,
      enum: vcPedidoAcao,
      required: true,
    },
  },
  historico: {
    type: Array,
    required: false,
  },
  distribuicao: [
    {
      estado: {
        type: String,
        enum: vcPedidoEstado,
        required: true,
      },
      responsavel: {
        type: String, // Email do técnico responsável pelo pedido neste estado
      },
      proximoResponsavel: {
        nome: {
          type: String,
        },
        entidade: {
          type: String,
        },
        email: {
          type: String,
        },
      },
      data: {
        type: Date,
        default: Date.now,
        required: true,
      },
      despacho: {
        type: String,
      },
    },
  ],
  entidade: {
    type: String,
    required: false,
  },
});

PedidoSchema.pre("validate", async function (next) {
  if (!this.codigo) {
    const year = new Date().getFullYear();
    const pattern = "^" + year + "-.*";
    var pedidos = await mongoose
      .model("Pedido")
      .find({ codigo: { $regex: pattern } }, { codigo: 1, _id: 0 });
    pedidos = pedidos.map((p) => Number(p.codigo.split("-")[1]));
    let count = pedidos.reduce((a, b) => Math.max(a, b), 0) + 1;
    this.codigo = `${year}-${count.toString().padStart(7, "0")}`;
  }
  next();
});

PedidoSchema.methods.sparqlQuery = function () {
  console.log(JSON.stringify(this));
  const rdf_types = {
    Entidade: "clav:Entidade",
    Legislação: "clav:Legislacao",
    "Termo de Indice": "clav:TermoIndice",
    Tipologia: "clav:TipologiaEntidade",
    "Auto de Eliminacao": "clav:AutoEliminacao",
  };
  const rdf_type = rdf_types[this.objeto.tipo];
  let query = "";

  if (this.objeto.acao === "Criação") {
    query = `INSERT DATA {
            ${this.objeto.codigo} rdf:type owl:NamedIndividual, ${rdf_type} .
            ${this.objeto.triplos
              .map(
                (triplo) =>
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
