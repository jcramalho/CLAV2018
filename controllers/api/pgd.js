const execQuery = require("../../controllers/api/utils").execQuery;
const normalize = require("../../controllers/api/utils").normalize;
var Pedidos = require("../../controllers/api/pedidos");

var PGD = module.exports;

PGD.listar = async function () {
  let query = `
  select ?idPGD ?idLeg ?data ?numero ?tipo ?sumario ?link where { 
    ?uri a clav:PGD ;
        clav:eRepresentacaoDe ?l .
      ?l clav:diplomaData ?data;
         clav:diplomaNumero ?numero;
         clav:diplomaTipo ?tipo;
         clav:diplomaSumario ?sumario ;
         clav:diplomaFonte "PGD" ;
         clav:diplomaLink ?link .
    BIND(STRAFTER(STR(?uri), 'clav#') AS ?idPGD).
    BIND(STRAFTER(STR(?l), 'clav#') AS ?idLeg).
  } 
  `;

  return execQuery("query", query).then((response) => {
    return normalize(response);
  });
};

PGD.listarLC = async function () {
  let query = `
  select ?idPGD ?idLeg ?data ?numero ?tipo ?sumario ?link where { 
    ?uri a clav:PGD ;
        clav:eRepresentacaoDe ?l .
      ?l clav:diplomaData ?data;
         clav:diplomaNumero ?numero;
         clav:diplomaTipo ?tipo;
         clav:diplomaSumario ?sumario ;
         clav:diplomaFonte "PGD/LC" ;
         clav:diplomaLink ?link .
    BIND(STRAFTER(STR(?uri), 'clav#') AS ?idPGD).
    BIND(STRAFTER(STR(?l), 'clav#') AS ?idLeg).
  } 
  `;

  return execQuery("query", query).then((response) => {
    return normalize(response);
  });
};

PGD.listarRADA = async function () {
  let query = `
  select ?idRADA ?idLeg ?data ?numero ?tipo ?ent ?sumario ?estado ?link where { 
    ?uri a clav:RADA_Antigo ;
        clav:temEntidadeResponsavel ?ent;
        clav:eRepresentacaoDe ?l .
      ?l clav:diplomaData ?data;
         clav:diplomaEstado ?estado;
         clav:diplomaNumero ?numero;
         clav:diplomaTipo ?tipo;
         clav:diplomaSumario ?sumario ;
         clav:diplomaFonte "RADA" ;
         clav:diplomaLink ?link .
    BIND(STRAFTER(STR(?uri), 'clav#') AS ?idRADA).
    BIND(STRAFTER(STR(?l), 'clav#') AS ?idLeg).
  } 
  `;

  return execQuery("query", query).then((response) => {
    return normalize(response);
  });
};

PGD.consultarRADA = async function (id) {
  let query = `
  select ?classe ?nivel ?codigo ?referencia ?titulo ?descricao ?diplomas ?df ?notaDF ?pca ?notaPCA ?formaContagem ?justificacaoPCA ?justificacaoDF ?classePai where {
    ?uriClasse clav:pertenceAntigoRada clav:${id} ;
               clav:nivel ?nivel ;
    OPTIONAL { ?uriClasse clav:codigo ?codigo; }
    OPTIONAL { ?uriClasse clav:referencia ?referencia; }
    OPTIONAL { ?uriClasse clav:titulo ?titulo; }
    OPTIONAL { ?uriClasse clav:descricao ?descricao; }
    OPTIONAL { ?uriClasse clav:diplomas ?diplomas; }
    OPTIONAL { ?uriClasse clav:formaContagemDesnormalizada ?formaContagem; }
    OPTIONAL { ?uriClasse clav:temDF ?uriDF.
        OPTIONAL { ?uriDF clav:dfValor ?df }
        OPTIONAL { ?uriDF clav:dfNota ?notaDF} 
        OPTIONAL { ?uriDF clav:temJustificacao ?uriJustDF .
          ?uriJustDF clav:temCriterio ?critDF .
          ?critDF clav:conteudo ?justificacaoDF .
        }
    }
    OPTIONAL { ?uriClasse clav:temPCA ?uriPCA.
        OPTIONAL { ?uriPCA clav:pcaValor ?pca }
        OPTIONAL { ?uriPCA clav:pcaNota ?notaPCA} 
        OPTIONAL { ?uriPCA clav:temJustificacao ?uriJustPCA .
          ?uriJustPCA clav:temCriterio ?critPCA .
          ?critPCA clav:conteudo ?justificacaoPCA .
        }
    }
    OPTIONAL { ?uriClasse clav:temPai ?uriClassePai }
	BIND(STRAFTER(STR(?uriClasse), 'clav#') AS ?classe).
	BIND(STRAFTER(STR(?uriClassePai), 'clav#') AS ?classePai).
}
  `;

  return execQuery("query", query).then((response) => {
    return normalize(response);
  });
};

PGD.consultar = async function (idPGD) {
  let query = `
  select ?classe ?nivel ?codigo ?referencia ?titulo ?descricao ?df ?notaDF ?pca ?notaPCA ?formaContagem ?subFormaContagem ?classePai where {
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
    OPTIONAL { 
      ?uriClasse clav:pcaFormaContagemNormalizada ?uriFormaContagem .
      ?uriFormaContagem skos:prefLabel ?formaContagem .
      OPTIONAL { 
        ?uriClasse clav:pcaSubformaContagem ?uriSubFormaContagem .
        ?uriSubFormaContagem skos:prefLabel ?subFormaContagem .
      }
    }
    OPTIONAL { ?uriClasse clav:temPai ?uriClassePai }
    BIND(STRAFTER(STR(?uriClasse), 'clav#') AS ?classe).
    BIND(STRAFTER(STR(?uriClassePai), 'clav#') AS ?classePai).
  }
  `;

  try {
    let result = await execQuery("query", query);
    result = normalize(result);
    pca = [];
    i = 0;
    for (var r of result) {
      if (r.nivel > 2) {
        var queryDonos = `
          SELECT ?entDono WHERE {
            clav:${r.classe} clav:temDono ?uriEntDono .
            BIND(STRAFTER(STR(?uriEntDono), 'ent_') AS ?entDono).
          }
        `;
        var resultDonos = await execQuery("query", queryDonos);
        resultDonos = normalize(resultDonos);
        if (resultDonos && resultDonos.length > 0) r.donos = resultDonos;

        var queryParts = `
          SELECT ?entParticipante WHERE {
            clav:${r.classe} clav:temParticipante ?uriEntParticipante .
            BIND(STRAFTER(STR(?uriEntParticipante), 'ent_') AS ?entParticipante).
          }
        `;
        var resultParts = await execQuery("query", queryParts);
        resultParts = normalize(resultParts);
        if (resultParts && resultParts.length > 0)
          r.participantes = resultParts;

        if (r.codigo == "400.10.001") {
          pca.push(r.pca);
          if (result[i + 1].codigo != "400.10.001") {
            result.splice(i - 2, 2);
            r.pca = pca.join();
          }
        }
      }
      i++;
    }
    return result;
  } catch (erro) {
    throw erro;
  }
};
