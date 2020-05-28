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

PGD.adicionar = async function (pgd) {
  var queryNum = `
        SELECT * WHERE {
            ?pgd a clav:PGD .
        }
    `
  try {
    let resultNum = await execQuery("query", queryNum);
    var id = "pgd_"+normalize(resultNum).length

    var query = `{
      clav:${id} a clav:PGD ;
                clav:designacao "${pgd.designacao}" ;
                clav:dataCriacao "${pgd.dataCriacao}" .
    `
    for(ent of pgd.entidades) {
      query += `
        clav:${id} clav:pertenceEntidade clav:ent_${ent.split(" - ")[0]} .
      `
    }

    for(cPgd of pgd.classes) {
      var codigo = cPgd.codigo || ""
      var referencia = cPgd.referencia || "" 
      var idClasse = "c" + codigo + "_r" + referencia + "_"+ id
      query += `
        clav:${idClasse} a clav:Classe_PGD ;
                      clav:pertencePGD clav:${id} ;
                      clav:titulo "${cPgd.titulo}" .
      `
      if(cPgd.codigo) query += `
        clav:${idClasse} clav:codigo "${cPgd.codigo}" .
      `
      if(cPgd.referencia) query += `
        clav:${idClasse} clav:referencia "${cPgd.referencia}" .
      `
      query += `
        clav:df_${idClasse} a clav:DestinoFinal ;
                        clav:dfValor "${cPgd.df}" .
      `
      if(cPgd.notasDF) query += `
        clav:df_${idClasse} clav:dfNota "${cPgd.notasDF}" ;
      `
      query += `
        clav:pca_${idClasse} a clav:PCA ;
                        clav:pcaValor "${cPgd.pca}" .
      `
      if(cPgd.notasPCA) query += `
        clav:pca_${idClasse} clav:pcaNota "${cPgd.notasPCA}" ;
      `
    }
    query += `
    }
    `
    var inserir = "INSERT DATA "+query;
    var ask = "ASK "+ query;

    return execQuery("update", inserir).then(res =>
      execQuery("query", ask).then(result => {
        if (result.boolean) return "Sucesso na inserção da portaria de gestão de documentos";
        else throw "Insucesso na inserção do portaria de gestão de documentos";
      })
    );
  }
  catch (e) { throw (erro); }
} 