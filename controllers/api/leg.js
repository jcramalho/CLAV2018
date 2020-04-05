const execQuery = require("../../controllers/api/utils").execQuery;
const normalize = require("../../controllers/api/utils").normalize;
const projection = require("../../controllers/api/utils").projection;
const request = require("../../controllers/api/utils").request;
const Leg = module.exports;

/**
 * @typedef {Object} Legislacao
 * @property {string} id (ex: "leg_1234")
 * @property {string} numero (ex: "2230/20")
 * @property {string} data (ex: "2018/11/26")
 * @property {string} tipo (ex: "Lei", "Deliberação", "Regulamento", "Estatuto", etc...)
 * @property {string} titulo descrição da legislação
 * @property {string} estado (ex: "Ativa", "Inativa" ou "Harmonização")
 * @property {[string]} entidades (ex: ["ent_CEE", "ent_AR"])
 */

/**
 * Lista as meta informações de todas as legislações no sistema, de acordo com
 * o filtro especificado.
 *
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado. TODO: ainda por implementar
 * @return {Promise<[Legislacao] | Error>} promessa que quando cumprida contém a
 * lista das legislacoes existentes que respeitam o filtro dado
 */
Leg.listar = () => {
  const query = `SELECT ?id ?data ?numero ?tipo ?sumario ?estado ?entidades ?fonte ?link WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado ?estado.
        OPTIONAL {
          ?uri clav:diplomaLink ?link.
        }
        OPTIONAL {
        	?uri clav:diplomaFonte ?fonte.
        }
        OPTIONAL {
            ?uri clav:temEntidadeResponsavel ?ent.
            ?ent clav:entSigla ?entidades;
        }
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).
    } ORDER BY DESC (?data)`;
  const campos = [
    "id",
    "data",
    "numero",
    "tipo",
    "sumario",
    "estado",
    "fonte",
    "link"
  ];
  const agrupar = ["entidades"];

  return execQuery("query", query).then(response => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map(ent => ({
        id: `ent_${ent}`,
        sigla: ent
      }));
    }

    return legs;
  });
};

//Lista todas as legislações consoante o estado
Leg.listarPorEstado = estado => {
  const query = `SELECT ?id ?data ?numero ?tipo ?sumario ?entidades ?fonte ?link WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado "${estado}";
             clav:diplomaLink ?link.
        OPTIONAL {
        	?uri clav:diplomaFonte ?fonte.
        }
        OPTIONAL {
            ?uri clav:temEntidadeResponsavel ?ent.
            ?ent clav:entSigla ?entidades;
        }
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).

    } ORDER BY DESC (?data)`;
  const campos = ["id", "data", "numero", "tipo", "sumario", "fonte", "link"];
  const agrupar = ["entidades"];

  return execQuery("query", query).then(response => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map(ent => ({
        id: `ent_${ent}`,
        sigla: ent
      }));
      leg.estado = estado;
    }

    return legs;
  });
};

// Lista todas as legislações com PNs associados
Leg.listarComPNs = () => {
  const query = `SELECT ?id ?data ?numero ?tipo ?sumario ?estado ?entidades ?fonte ?link WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado ?estado;
             clav:diplomaLink ?link.
        OPTIONAL {
        	?uri clav:diplomaFonte ?fonte.
        } 
        OPTIONAL {
            ?uri clav:temEntidadeResponsavel ?ent.
            ?ent clav:entSigla ?entidades;
        }
    	FILTER EXISTS {?uri clav:estaAssoc ?pn.}
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).

        FILTER (?estado = "Ativo")
    } ORDER BY DESC (?data)`;
  const campos = [
    "id",
    "data",
    "numero",
    "tipo",
    "sumario",
    "estado",
    "fonte",
    "link"
  ];
  const agrupar = ["entidades"];

  return execQuery("query", query).then(response => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map(ent => ({
        id: `ent_${ent}`,
        sigla: ent
      }));
    }

    return legs;
  });
};

// Lista todas as legislações sem PNs associados
Leg.listarSemPNs = () => {
  const query = `SELECT ?id ?data ?numero ?tipo ?sumario ?estado ?entidades ?fonte ?link WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado ?estado;
             clav:diplomaLink ?link .
        OPTIONAL {
        	?uri clav:diplomaFonte ?fonte.
        } 
        OPTIONAL {
            ?uri clav:temEntidadeResponsavel ?ent.
            ?ent clav:entSigla ?entidades;
        }
    	FILTER NOT EXISTS {?uri clav:estaAssoc ?pn.}
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).

        FILTER (?estado = "Ativo")
    } ORDER BY DESC (?data)`;
  const campos = [
    "id",
    "data",
    "numero",
    "tipo",
    "sumario",
    "estado",
    "fonte",
    "link"
  ];
  const agrupar = ["entidades"];

  return execQuery("query", query).then(response => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map(ent => ({
        id: `ent_${ent}`,
        sigla: ent
      }));
    }

    return legs;
  });
};

//Lista processos regulados de todas as legislacoes
Leg.listarRegulados = async () => {
  const query = `SELECT ?id
                        (GROUP_CONCAT(?regCodigo; SEPARATOR="#") AS ?rc)
                        (GROUP_CONCAT(?regTitulo; SEPARATOR="#") AS ?rt) {
        ?uri rdf:type clav:Legislacao.

        OPTIONAL{
            {
                ?uriP clav:temLegislacao ?uri;
            }
            UNION {
                ?crit clav:temLegislacao ?uri.
                ?just clav:temCriterio ?crit .
                ?aval clav:temJustificacao ?just .

                {
                    ?uriP clav:temPCA ?aval ;
                }
                UNION {
                    ?uriP clav:temDF ?aval ;
                }
            }
            ?uriP clav:codigo ?regCodigo;
                clav:titulo ?regTitulo;
                clav:classeStatus 'A'.
        }

        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)
    }
    group by ?id`;

  try {
    var response = await execQuery("query", query);
    var res = normalize(response);

    for (var i = 0; i < res.length; i++) {
      res[i].regula = [];
      if (res[i].rc != "") {
        var codigos = res[i].rc.split("#");
        var titulos = res[i].rt.split("#");

        for (var j = 0; j < codigos.length; j++) {
          res[i].regula.push({
            codigo: codigos[j],
            titulo: titulos[j],
            id: "c" + codigos[j]
          });
        }
      }

      delete res[i].rc;
      delete res[i].rt;
    }

    return res;
  } catch (erro) {
    throw erro;
  }
};

/**
 * Consulta a meta informação relativa a uma legislação
 * (tipo, data, número, título, link e entidades).
 *
 * @param {string} id código identificador da legislação (p.e, "leg_1234")
 * @return {Promise<Tipologia | Error>} promessa que quando cumprida contém a
 * legislação que corresponde ao identificador dado. Se a legislação não existir
 * então a promessa conterá o valor `undefined`
 */
Leg.consultar = id => {
  const query = `SELECT ?tipo ?data ?numero ?sumario ?link ?estado ?fonte ?entidades WHERE { 
        clav:${id} a clav:Legislacao;
            clav:diplomaData ?data;
            clav:diplomaNumero ?numero;
            clav:diplomaTipo ?tipo;
            clav:diplomaSumario ?sumario;
            clav:diplomaLink ?link;
            clav:diplomaEstado ?estado.
        OPTIONAL {
        	clav:${id} clav:diplomaFonte ?fonte.
        }
        OPTIONAL {
            clav:${id} clav:temEntidadeResponsavel ?ent.
            ?ent clav:entSigla ?entidades;
        }
     }`;
  const campos = [
    "id",
    "data",
    "numero",
    "tipo",
    "sumario",
    "link",
    "estado",
    "fonte"
  ];
  const agrupar = ["entidades"];

  return execQuery("query", query).then(
    response => projection(normalize(response), campos, agrupar)[0]
  );
};

/**
 * Verifica se um determinado numero de legislação existe no sistema.
 *
 * @param {Legislacao} legislacao
 * @return {Promise<boolean | Error>}
 */
Leg.existe = numero => {
  const query = `ASK {
            ?e clav:diplomaNumero '${numero}'
        }`;

  return execQuery("query", query).then(response => response.boolean);
};

/**
 * Verifica se um determinado numero de legislação existe no sistema.
 *
 * @param {Legislacao} legislacao
 * @return {Promise<boolean | Error>}
 */
Leg.existeId = numero => {
  const query = `select ?s where {
            ?s clav:diplomaNumero '${numero}'
        }`;

  return execQuery("query", query).then(response => {
      var res = normalize(response)[0]
      if(res) res = res.s.split("#")[1]
      return res
  });
};

/**
 * Verifica se uma determinada legislação tem PNs associados.
 *
 * @param {Legislacao} legislacao
 * @return {Promise<boolean | Error>}
 */
Leg.temPNs = legislacao => {
  const query = `ASK {
        ?e clav:temLegislacao clav:'${legislacao.id}'
        }`;

  return execQuery("query", query).then(response => response.boolean);
};

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
Leg.regula = id => {
  var query = `
        SELECT DISTINCT ?id ?codigo ?titulo WHERE { 
            {
                ?uri clav:temLegislacao clav:${id};
            } 
            UNION {
                ?crit clav:temLegislacao clav:${id} .
                ?just clav:temCriterio ?crit .
                ?aval clav:temJustificacao ?just .

                {
                    ?uri clav:temPCA ?aval ;
                } 
                UNION {
                    ?uri clav:temDF ?aval ;
                }
            }
            ?uri clav:codigo ?codigo;
                clav:titulo ?titulo;
                clav:classeStatus 'A'.

            BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)
                
        } ORDER BY ?codigo
    `;
  return execQuery("query", query).then(response => normalize(response));
};

/**
 * Verifica se um determinado numero de legislação existe no sistema.
 *
 * @param {Legislacao} legislacao
 * @return {Promise<[Legislacao] | Error>} promessa que quando cumprida contém a
 * lista das legislacoes que são do Tipo "Portaria"
 */
Leg.portarias = () => {
  const query = `
    SELECT * WHERE {
        ?legislacao a clav:Legislacao ;
             clav:diplomaTipo "Portaria" ;
             clav:diplomaNumero ?numero ;
             clav:diplomaSumario ?sumario ;
             clav:diplomaEstado ?estado .
    }`;

  return execQuery("query", query).then(response => normalize(response));
};

/**
 * Lista as meta informações de todas as legislações no sistema, de acordo com
 * a fonte especificada.
 *
 * @param {Object} fonte objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado. TODO: ainda por implementar
 * @return {Promise<[Legislacao] | Error>} promessa que quando cumprida contém a
 * lista das legislacoes existentes que respeitam a fonte dada
 */
Leg.listarFonte = fonte => {
  const query = `SELECT ?id ?data ?numero ?tipo ?sumario ?entidades ?link WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado "Ativo";
             clav:diplomaLink ?link;
             clav:diplomaFonte "${fonte}".
        OPTIONAL {
            ?uri clav:temEntidadeResponsavel ?ent.
            ?ent clav:entSigla ?entidades;
        }
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).
    } ORDER BY DESC (?data)`;
  const campos = ["id", "data", "numero", "tipo", "sumario", "link"];
  const agrupar = ["entidades"];

  return execQuery("query", query).then(response => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map(ent => ({
        id: `ent_${ent}`,
        sigla: ent
      }));
      leg.fonte = fonte;
    }

    return legs;
  });
};

//Obtém o resto da info das Legislacoes
Leg.moreInfoList = async legs => {
  //obtém os processos regulados para todas as legislações
  var data = await Leg.listarRegulados();
  var regulados = [];

  for (var i = 0; i < data.length; i++) {
    regulados[data[i].id] = data[i].regula;
  }

  for (i = 0; i < legs.length; i++) {
    legs[i].regula = regulados[legs[i].id];
  }
};

//Obtém o resto da info da Legislacao
Leg.moreInfo = async leg => {
  leg.regula = await Leg.regula(leg.id);
};

//Criar legislação
Leg.criar = async leg => {
  const nanoid = require('nanoid')
  var id = "leg_" + nanoid();

  let baseQuery = `{
    clav:${id} rdf:type owl:NamedIndividual, clav:Legislacao ;
        clav:rdfs:label "Leg.: ${leg.tipo} ${leg.numero}" ;
        clav:diplomaData "${leg.data}" ;
        clav:diplomaNumero "${leg.numero}" ;
        clav:diplomaTipo "${leg.tipo}" ;
        clav:diplomaSumario "${leg.sumario}" ;
        clav:diplomaEstado "${leg.estado}"`;

  if (leg.diplomaFonte)
    baseQuery += ` ;\n\tclav:diplomaFonte "${leg.diplomaFonte}"`;

  if (leg.link) baseQuery += ` ;\n\tclav:diplomaLink "${leg.link}"`;

  if (leg.entidadesSel && leg.entidadesSel.length > 0) {
    baseQuery += ` ;\n\tclav:temEntidadeResponsavel ${
      leg.entidadesSel.map(ent => `clav:${ent.id}`).join(", ")
    }`;
  }

  if (leg.processosSel && leg.processosSel.length > 0) {
    baseQuery += ` ;\n\tclav:estaAssoc ${
      leg.processosSel.map(proc => `clav:c${proc.codigo}`).join(", ")
    }`;
  }

  baseQuery += " .\n}";

  const query = "INSERT DATA " + baseQuery;
  const ask = "ASK " + baseQuery;

  return execQuery("update", query).then(res =>
    execQuery("query", ask).then(result => {
      if (result.boolean) return "Sucesso na inserção da legislação";
      else throw "Insucesso na inserção da legislação";
    })
  );
};

/*
Leg.updateDoc = function (dataObj) {

    var del = "";
    var ins = "";
    var wer = "";

    if (dataObj.year) {
        del += `clav:${dataObj.id} clav:diplomaAno ?y .\n`;
        ins += `clav:${dataObj.id} clav:diplomaAno "${dataObj.year}" .\n`;
    }
    if (dataObj.date) {
        del += `clav:${dataObj.id} clav:diplomaData ?d .\n`;
        ins += `clav:${dataObj.id} clav:diplomaData "${dataObj.date}" .\n`;
    }
    if (dataObj.number) {
        del += `clav:${dataObj.id} clav:diplomaNumero ?n .\n`;
        ins += `clav:${dataObj.id} clav:diplomaNumero "${dataObj.number}" .\n`;
    }
    if (dataObj.type) {
        del += `clav:${dataObj.id} clav:diplomaTipo ?t .\n`;
        ins += `clav:${dataObj.id} clav:diplomaTipo "${dataObj.type}" .\n`;
    }
    if (dataObj.title) {
        del += `clav:${dataObj.id} clav:diplomaTitulo ?tit .\n`;
        ins += `clav:${dataObj.id} clav:diplomaTitulo "${dataObj.title}" .\n`;
    }
    if (dataObj.link) {
        del += `clav:${dataObj.id} clav:diplomaLink ?l .\n`;
        ins += `clav:${dataObj.id} clav:diplomaLink "${dataObj.link}" .\n`;
    }

    if (dataObj.org && dataObj.org.length) {
        del += `clav:${dataObj.id} clav:temEntidadeResponsavel ?org .\n`;

        for(let ent of dataObj.org){
            ins += `clav:${dataObj.id} clav:temEntidadeResponsavel clav:${ent}.\n`;
        }
    }

    wer = "WHERE {\n" + del + "}\n";
    del = "DELETE {\n" + del + "}\n";
    ins = "INSERT {\n" + ins + "}\n";

    var updateQuery = del + ins + wer;

    console.log(updateQuery);

    return execQuery("update", updateQuery)
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in update:\n" + error));
};
*/
