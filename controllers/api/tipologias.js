const execQuery = require("../../controllers/api/utils").execQuery;
const normalize = require("../../controllers/api/utils").normalize;
const allTriplesFrom = require("../../controllers/api/utils").allTriplesFrom;
const allTriplesRel = require("../../controllers/api/utils").allTriplesRel;
const request = require("../../controllers/api/utils").request;
const Tipologias = module.exports;

/**
 * @typedef {Object} Tipologia
 * @property {string} id (ex: "tip_AP")
 * @property {string} sigla (ex: "AP")
 * @property {string} designacao (ex: "Administração Pública")
 * @property {string} estado (ex: "Ativa", "Inativa" ou "Harmonização")
 */

/**
 * Lista as meta informações de todas as tipologias de entidades no sistema,
 * de acordo com o filtro especificado.
 *
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado.
 * @param {string} filtro.sigla (ex: "AP")
 * @param {string} filtro.designacao (ex: "Administração Pública")
 * @param {string} filtro.estado (ex: "Ativa", "Inativa" ou "Harmonização")
 * @return {Promise<[Tipologia] | Error>} promessa que quando cumprida contém a
 * lista das tipologias de entidades existentes que respeitam o filtro dado
 */
Tipologias.listar = filtro => {
  const query = `SELECT ?id ?estado ?designacao ?sigla {
        ?uri rdf:type clav:TipologiaEntidade ;
            clav:tipEstado ?estado;
            clav:tipDesignacao ?designacao ;
            clav:tipSigla ?sigla .
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)

        FILTER (${filtro})
    }`;

  return execQuery("query", query).then(response => normalize(response));
};

//Lista donos de todas as tipologias
Tipologias.listarDonos = async () => {
  const query = `SELECT ?sigla
                        (GROUP_CONCAT(DISTINCT ?donoCodigo; SEPARATOR="#") AS ?dc)
                        (GROUP_CONCAT(DISTINCT ?donoTitulo; SEPARATOR="#") AS ?dt){
        ?uri rdf:type clav:TipologiaEntidade ;
            clav:tipSigla ?sigla .

        OPTIONAL{
            ?uriD clav:temDono ?uri ;
                clav:codigo ?donoCodigo ;
                clav:titulo ?donoTitulo ;
                clav:pertenceLC clav:lc1;
                clav:classeStatus "A" .
        }
    }
    group by ?sigla`;

  try {
    var response = await execQuery("query", query);
    var res = normalize(response);

    for (var i = 0; i < res.length; i++) {
      res[i].dono = [];
      if (res[i].dc != "") {
        var codigos = res[i].dc.split("#");
        var titulos = res[i].dt.split("#");

        for (var j = 0; j < codigos.length; j++) {
          res[i].dono.push({
            codigo: codigos[j],
            titulo: titulos[j],
            id: "c" + codigos[j]
          });
        }
      }

      delete res[i].dc;
      delete res[i].dt;
    }

    return res;
  } catch (erro) {
    throw erro;
  }
};

//Lista participantes de todas as tipologias
Tipologias.listarParticipantes = async () => {
  const query = `SELECT ?sigla
                        (GROUP_CONCAT(?parCodigo; SEPARATOR="#") AS ?pc)
                        (GROUP_CONCAT(?parTitulo; SEPARATOR="#") AS ?pt)
                        (GROUP_CONCAT(?tipoP; SEPARATOR="#") AS ?tp){
        ?uri rdf:type clav:TipologiaEntidade ;
            clav:tipSigla ?sigla .

        OPTIONAL{
            ?uriP clav:temParticipante ?uri ;
                ?tipoParURI ?uri ;
                clav:codigo ?parCodigo ;
                clav:titulo ?parTitulo ;
                clav:pertenceLC clav:lc1 ;
                clav:classeStatus "A" .

            BIND (STRAFTER(STR(?tipoParURI), 'clav#') AS ?tipoP).
            FILTER (?tipoParURI != clav:temParticipante && ?tipoParURI != clav:temDono)
        }
    }
    group by ?sigla`;

  try {
    var response = await execQuery("query", query);
    var res = normalize(response);

    for (var i = 0; i < res.length; i++) {
      res[i].participante = [];
      if (res[i].pc != "") {
        var codigos = res[i].pc.split("#");
        var titulos = res[i].pt.split("#");
        var tiposPar = res[i].tp.split("#");

        for (var j = 0; j < codigos.length; j++) {
          res[i].participante.push({
            tipoPar: tiposPar[j],
            codigo: codigos[j],
            titulo: titulos[j],
            id: "c" + codigos[j]
          });
        }
      }

      delete res[i].pc;
      delete res[i].pt;
      delete res[i].tp;
    }

    return res;
  } catch (erro) {
    throw erro;
  }
};

//Lista elementos de todas as tipologias
Tipologias.listarElementos = async () => {
  const query = `SELECT ?sigla
                        (GROUP_CONCAT(?parId; SEPARATOR="#") AS ?idE)
                        (GROUP_CONCAT(?parSigla; SEPARATOR="#") AS ?siglaE)
                        (GROUP_CONCAT(?parDesignacao; SEPARATOR="#") AS ?designacaoE){
        ?uri rdf:type clav:TipologiaEntidade ;
            clav:tipSigla ?sigla .

        OPTIONAL{
            ?uriP clav:entEstado "Ativa";
                clav:entSigla ?parSigla;
                clav:entDesignacao ?parDesignacao.

            BIND(STRAFTER(STR(?uriP), 'clav#') AS ?parId)
        }
    }
    group by ?sigla`;

  try {
    var response = await execQuery("query", query);
    var res = normalize(response);

    for (var i = 0; i < res.length; i++) {
      res[i].entidades = [];
      if (res[i].idE != "") {
        var ids = res[i].idE.split("#");
        var siglas = res[i].siglaE.split("#");
        var designacoes = res[i].designacaoE.split("#");

        for (var j = 0; j < ids.length; j++) {
          res[i].entidades.push({
            id: ids[j],
            sigla: siglas[j],
            designacao: designacoes[j]
          });
        }
      }

      delete res[i].idE;
      delete res[i].siglaE;
      delete res[i].designacaoE;
    }

    return res;
  } catch (erro) {
    throw erro;
  }
};

/**
 * Consulta a meta informação relativa a uma tipologia entidade
 * (sigla, designação e estado).
 *
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @return {Promise<Tipologia | Error>} promessa que quando cumprida contém a
 * tipologia que corresponde ao identificador dado. Se a tipologia não existir
 * então a promessa conterá o valor `undefined`
 */
Tipologias.consultar = id => {
  const query = `SELECT ?designacao ?sigla ?estado where {
        clav:${id} clav:tipDesignacao ?designacao ;
            clav:tipSigla ?sigla ;
            clav:tipEstado ?estado .
    }`;

  return execQuery("query", query).then(response => normalize(response)[0]);
};

//Criar controller para inserir na base de dados, depois do pedido aprovado!!
/*const query = `INSERT DATA {
        clav:tip_${tipologia.sigla} rdf:type owl:NamedIndividual , clav:TipologiaEntidade ;
            clav:tipDesignacao '${tipologia.designacao}' ;
            clav:tipSigla '${tipologia.sigla}' ;
            
        ${tipologia.entidades.map(entidade => `clav:contemEntidade clav:${entidade} ;`).join('\n')}
        clav:tipEstado "Harmonização" .
    }`;*/

/**
 * Verifica se uma determinada tipologia existe no sistema.
 *
 * @param {Tipologias} tipologia
 * @return {Promise<boolean | Error>}
 */
Tipologias.existe = tipologia => {
  const query = `ASK {
        { ?e clav:tipDesignacao '${tipologia.designacao}' }
        UNION
        { ?s clav:tipSigla '${tipologia.sigla}' }
    }`;

  return execQuery("query", query).then(response => response.boolean);
};

/**
 * Verifica se uma determinada sigla de tipologia existe no sistema.
 *
 * @param {Sigla} sigla
 * @return {Promise<boolean | Error>}
 */
Tipologias.existeSigla = sigla => {
  const query = `ASK {
    ?s clav:tipSigla '${sigla}'
  }`;

  return execQuery("query", query).then(response => response.boolean);
};

/**
 * Verifica se uma determinada sigla de tipologia existe no sistema e retorna o id dessa.
 *
 * @param {Sigla} sigla
 * @return {Promise<boolean | Error>}
 */
Tipologias.existeSiglaId = sigla => {
  const query = `select ?s where {
    ?s clav:tipSigla '${sigla}' 
  }`;

  return execQuery("query", query).then(response => {
      var res = normalize(response)[0]
      if(res) res = res.s.split("#")[1]
      return res
  });
};

/**
 * Verifica se uma determinada designacao de tipologia existe no sistema.
 *
 * @param {Designacao} designacao
 * @return {Promise<boolean | Error>}
 */
Tipologias.existeDesignacao = designacao => {
  const query = `ASK {
    ?e clav:tipDesignacao '${designacao}'
  }`;

  return execQuery("query", query).then(response => response.boolean);
};

/**
 * Verifica se uma determinada designacao de tipologia existe no sistema e retorna o id dessa.
 *
 * @param {Designacao} designacao
 * @return {Promise<boolean | Error>}
 */
Tipologias.existeDesignacaoId = designacao => {
  const query = `select ?s where {
    ?s clav:tipDesignacao '${designacao}' 
  }`;

  return execQuery("query", query).then(response => {
      var res = normalize(response)[0]
      if(res) res = res.s.split("#")[1]
      return res
  });
};

/**
 * Lista as entidades que pertencem a uma dada tipologia.
 *
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @return {Promise<[Entidade] | Error>} promessa que quando cumprida contém a
 * lista das entidades que pertencem à tipologia dada
 */
Tipologias.elementos = id => {
  const query = `SELECT ?id ?sigla ?designacao WHERE {
        ?uri clav:pertenceTipologiaEnt clav:${id} .
        
        ?uri clav:entEstado "Ativa";
            clav:entSigla ?sigla;
            clav:entDesignacao ?designacao.

        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)
    }`;

  return execQuery("query", query).then(response => normalize(response));
};

/**
 * Lista os processos em que uma tipologia intervem como dona.
 *
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @return {Promise<{codigo: string, titulo: string, id: string} | Error>} promessa
 * que quando cumprida contém os códigos e títulos dos processos onde a
 * tipologia participa como dona
 */
Tipologias.dono = id => {
  const query = `SELECT ?id ?codigo ?titulo WHERE {
        ?uri clav:temDono clav:${id} ;
            clav:codigo ?codigo ;
            clav:titulo ?titulo ;
            clav:pertenceLC clav:lc1;
            clav:classeStatus "A" .
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)
    }`;

  return execQuery("query", query).then(response => normalize(response));
};

/**
 * Lista os processos em que uma tipologia intervem como participante.
 *
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @return {Promise<[{codigo: string, titulo: string, id: string}] | Error>} promessa
 * que quando cumprida contém os códigos e títulos dos processos onde a
 * tipologia participa
 */
Tipologias.participante = id => {
  const query = `SELECT ?id ?tipoPar ?titulo ?codigo WHERE {
        ?uri clav:temParticipante clav:${id} ;
        ?tipoParURI clav:${id} ;
            clav:titulo ?titulo ;
            clav:codigo ?codigo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
    
        BIND (STRAFTER(STR(?uri), 'clav#') AS ?id).
        BIND (STRAFTER(STR(?tipoParURI), 'clav#') AS ?tipoPar).  
        FILTER (?tipoParURI != clav:temParticipante && ?tipoParURI != clav:temDono)
    }`;

  return execQuery("query", query).then(response => normalize(response));
};

Tipologias.checkAvailability = function(name, initials) {
  var checkQuery = `
        SELECT (count(*) as ?Count) where { 
            {
                ?t clav:tipSigla ?s ;
                    clav:tipDesignacao ?n .
            } UNION {
                ?e clav:entSigla ?s ;
                    clav:entDesignacao ?n .
            }
            filter (?s='${initials}' || ?n='${name}').
        }
    `;

  return (
    execQuery("query", checkQuery)
      //Getting the content we want
      .then(response =>
        Promise.resolve(response.results.bindings[0].Count.value)
      )
      .catch(function(error) {
        console.error("Error in check:\n" + error);
      })
  );
};

Tipologias.checkNameAvailability = function(name) {
  var checkQuery = ` 
        SELECT (count(*) as ?Count) where { 
            {
                ?t clav:tipDesignacao '${name}' .
            } UNION {
                ?e clav:entDesignacao '${name}' .
            }
        }
    `;

  return (
    execQuery("query", checkQuery)
      //Getting the content we want
      .then(response =>
        Promise.resolve(response.results.bindings[0].Count.value)
      )
      .catch(function(error) {
        console.error("Error in check:\n" + error);
      })
  );
};

Tipologias.updateTipologia = function(dataObj) {
  function prepDelete(dataObj) {
    let ret = "";

    if (dataObj.domain.del && dataObj.domain.del.length) {
      for (let process of dataObj.domain.del) {
        ret += `\tclav:${process.id} clav:temDono clav:${dataObj.id} .\n`;
      }
    }

    for (const pType in dataObj.parts) {
      if (dataObj.parts[pType].del && dataObj.parts[pType].del.length) {
        for (let p of dataObj.parts[pType].del) {
          ret +=
            "\tclav:" +
            p.id +
            " clav:temParticipante" +
            pType +
            " clav:" +
            dataObj.id +
            " .\n";
        }
      }
    }

    if (dataObj.ents.del && dataObj.ents.del.length) {
      for (let elem of dataObj.ents.del) {
        ret += `\tclav:${elem.id} clav:pertenceTipologiaEnt clav:${dataObj.id} .\n`;
      }
    }

    return ret;
  }

  function prepInsert(dataObj) {
    let ret = "";

    if (dataObj.name) {
      ret += `\tclav:${dataObj.id} clav:entDesignacao '${dataObj.name}' .\n`;
    }

    if (dataObj.international) {
      ret += `
                clav:${dataObj.id} clav:entInternacional '${dataObj.international}' .
            `;
    }

    if (dataObj.domain.add && dataObj.domain.add.length) {
      for (let process of dataObj.domain.add) {
        ret += `\tclav:${process.id} clav:temDono clav:${dataObj.id} .\n`;
      }
    }

    for (const pType in dataObj.parts) {
      if (dataObj.parts[pType].add && dataObj.parts[pType].add.length) {
        for (let p of dataObj.parts[pType].add) {
          ret +=
            "\tclav:" +
            p.id +
            " clav:temParticipante" +
            pType +
            " clav:" +
            dataObj.id +
            " .\n";
        }
      }
    }

    if (dataObj.ents.add && dataObj.ents.add.length) {
      for (let elem of dataObj.ents.add) {
        ret += `\tclav:${elem.id} clav:pertenceTipologiaEnt clav:${dataObj.id} .\n`;
      }
    }

    return ret;
  }

  function prepWhere(dataObj) {
    let ret = "";

    if (dataObj.name) {
      ret += `\tclav:${dataObj.id} clav:entDesignacao ?n .\n`;
    }

    return ret;
  }

  var deletePart =
    "DELETE {\n" + prepWhere(dataObj) + prepDelete(dataObj) + "}\n";
  var inserTPart = "INSERT {\n" + prepInsert(dataObj) + "}\n";
  var wherePart = "WHERE {\n" + prepWhere(dataObj) + "}\n";

  var updateQuery = deletePart + inserTPart + wherePart;

  return execQuery("update", updateQuery)
    .then(response => Promise.resolve(response))
    .catch(error => console.error("Error in update:\n" + error));
};

//Obtém o resto da info das Tipologias
Tipologias.moreInfoList = async tips => {
  //obtém os processos donos para todas as Tipologias
  var data = await Tipologias.listarDonos();
  var donos = [];

  for (var i = 0; i < data.length; i++) {
    donos[data[i].sigla] = {
      dono: data[i].dono
    };
  }

  //obtém os processos participantes e o tipo de participação para todas as tipologias
  data = await Tipologias.listarParticipantes();
  var parts = [];

  for (i = 0; i < data.length; i++) {
    parts[data[i].sigla] = {
      participante: data[i].participante,
      tipoPar: data[i].tipoPar
    };
  }

  //obtém as entidades para todas as Tipologias
  data = await Tipologias.listarElementos();
  var elementos = [];

  for (var i = 0; i < data.length; i++) {
    elementos[data[i].sigla] = {
      entidades: data[i].entidades
    };
  }

  for (i = 0; i < tips.length; i++) {
    tips[i].dono = donos[tips[i].sigla].dono;
    tips[i].participante = parts[tips[i].sigla].participante;
    tips[i].tipoPar = parts[tips[i].sigla].tipoPar;
    tips[i].entidades = elementos[tips[i].sigla].entidades;
  }
};

//Obtém o resto da info da Tipologia
Tipologias.moreInfo = async tip => {
  var id = "tip_" + tip.sigla;

  tip.entidades = await Tipologias.elementos(id);
  tip.dono = await Tipologias.dono(id);
  tip.participante = await Tipologias.participante(id);
};

//Cria tipologia em triplos dado um objeto tipologia
function queryTip(id, tip){
  if(!id){
    id = "tip_" + tip.sigla
  }

  var query = `clav:${id} rdf:type owl:NamedIndividual, clav:TipologiaEntidade ;
    clav:tipSigla "${tip.sigla}" ;
    clav:tipDesignacao "${tip.designacao}" ;
    clav:tipEstado "${tip.estado}" .`;

  if (tip.entidadesSel) {
    query += tip.entidadesSel
      .map(ent => `clav:${ent.id} clav:pertenceTipologiaEnt clav:${id}`)
      .join(".\n")
  }

  return query
}

//Criar tipologia
Tipologias.criar = async tip => {
  var queryPart = queryTip(undefined, tip)
  const query = `INSERT DATA {${queryPart}}`;
  const ask = `ASK {${queryPart}}`;

  return execQuery("update", query).then(res =>
    execQuery("query", ask).then(result => {
      if (result.boolean) return "Sucesso na inserção da tipologia";
      else throw "Insucesso na inserção da tipologia";
    })
  );
};

//Atualizar tipologia
Tipologias.atualizar = async (id, tip) => {
  const baseQuery = queryTip(id, tip)
  try{
    var triplesTip = await allTriplesFrom(id);
    triplesTip += await allTriplesRel("pertenceTipologiaEnt", id);
    var query = `DELETE {${triplesTip}}`;
    query += `INSERT {${baseQuery}}`
    query += `WHERE {${triplesTip}}`
    await execQuery("update", query);
    return "Sucesso na atualização da tipologia";
  }catch(e){
    throw "Insucesso na atualização da tipologia";
  }
}
