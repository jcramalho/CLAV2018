const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
var Pedidos = require('../../controllers/api/pedidos');


var PGD = module.exports

PGD.listar = async function() {
  let query = `
  select ?idPGD ?idLeg ?data ?numero ?tipo ?sumario ?link where { 
    ?uri a clav:PGD ;
        clav:temLegislacao ?l .
      ?l clav:diplomaData ?data;
         clav:diplomaNumero ?numero;
         clav:diplomaTipo ?tipo;
         clav:diplomaSumario ?sumario ;
         clav:diplomaLink ?link .
    BIND(STRAFTER(STR(?uri), 'clav#') AS ?idPGD).
    BIND(STRAFTER(STR(?l), 'clav#') AS ?idLeg).
  } 
  `
    const campos = [
      "idPGD",
      "idLeg",
      "data",
      "numero",
      "tipo",
      "sumario",
      "link"
    ];

    return execQuery("query", query).then(response => {
      return normalize(response);
    });
}

PGD.consultar = async function (idPGD) {
  let query = `
  select ?classe ?nivel ?codigo ?referencia ?titulo ?descricao ?df ?notaDF ?pca ?notaPCA ?classePai where {
    ?uriClasse clav:pertencePGD clav:${idPGD} ;
               clav:nivel ?nivel ;
    OPTIONAL { ?uriClasse clav:codigo ?codigo; }
    OPTIONAL { ?uriClasse clav:referencia ?referencia; }
    OPTIONAL { ?uriClasse clav:titulo ?titulo; }
    OPTIONAL { ?uriClasse clav:descricao ?descricao; }
    OPTIONAL { ?uriClasse clav:temDF ?uriDF.
        OPTIONAL { ?uriDF clav:dfValor ?df }
        OPTIONAL { ?uriDF clav:dfNota ?notaDF} 
    }
    OPTIONAL { ?uriClasse clav:temPCA ?uriPCA.
        OPTIONAL { ?uriPCA clav:pcaValor ?pca }
        OPTIONAL { ?uriPCA clav:pcaNota ?notaPCA} 
    }
    OPTIONAL { ?uriClasse clav:temPai ?uriClassePai }
	BIND(STRAFTER(STR(?uriClasse), 'clav#') AS ?classe).
	BIND(STRAFTER(STR(?uriClassePai), 'clav#') AS ?classePai).
}
  `
  const campos = [
    "classe",
    "nivel",
    "codigo",
    "referencia",
    "titulo",
    "descricao",
    "df",
    "notaDF",
    "pca",
    "notaPCA",
    "classePai",
  ]

  return execQuery("query", query).then(response => {
    return normalize(response);
  });
}
