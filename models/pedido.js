const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
    codigo: {
        type: String,
        index: true,
        match: /\d{1,}-\d{4,}/,
        required: true,
    },
    criadoPor: {
        type: String,           // Email do utilizador que criou o pedido
        required: true
    },
    objeto: {
        codigo: {
            type: String,
            required: true,
        },
        tipo: {
            type: String,
            enum: ["Processo de negócio", "Tabela de seleção", "Entidade", "Tipologia", "Legislação"],
            required: true,
        },
        acao: {
            type: String,
            enum: ["Criação", "Alteração", "Remoção"],
            required: true,
        },
        triplos: [{
            nome: String,
            sujeito: String,
            predicado: String,
            objeto: String,
        }],
    },
    distribuicao: [{
        estado: {
            type: String,
            enum: ["Em trabalho", "Submetido", "Em apreciação", "Em validação"],
            required: true,
        },
        responsavel: {
            type: String    // Email do técnico responsável pelo pedido neste estado
        },
        data: {
            type: Date,
            default: Date.now,
            required: true,
        },
        despacho: {
            type: String,
        }
    }]
});

PedidoSchema.pre('validate', async function(next) {
    let count = await mongoose.model('Pedido').count();
    this.codigo = `${count}-${new Date().getFullYear()}`;
    next();
});

PedidoSchema.methods.sparqlQuery = function() {
    console.log(JSON.stringify(this));
    const rdf_types = {
        "Entidade": "clav:Entidade",
        "Legislação": "clav:Legislacao",
        "Tipologia": "clav:TipologiaEntidade",
    };
    const rdf_type = rdf_types[this.objeto.tipo];
    let query = '';

    if (this.objeto.acao === 'Criação') {
        query = `INSERT DATA {
            ${this.objeto.codigo} rdf:type owl:NamedIndividual, ${rdf_type} .
            ${this.objeto.triplos.map(triplo =>`${triplo.sujeito} ${triplo.predicado} ${triplo.objeto}; `).join('\n')}
        }`;
    } else if (this.objeto.acao === 'Edição') {
        query = `DELETE {

        } WHERE {

        } INSERT {
            
        }`
    } else if (this.objeto.acao === 'Remoção') {
    }

    return query;
}

module.exports = mongoose.model('Pedido', PedidoSchema);