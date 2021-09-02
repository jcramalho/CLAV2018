const execQuery = require("../../controllers/api/utils").execQuery;
const normalize = require("../../controllers/api/utils").normalize;
const allTriplesFrom = require("../../controllers/api/utils").allTriplesFrom;
const triplesRelObj = require("../../controllers/api/utils").triplesRelObj;
const triplesRelSuj = require("../../controllers/api/utils").triplesRelSuj;
const projection = require("../../controllers/api/utils").projection;
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
  const query = `SELECT ?id ?data ?dataRevogacao ?numero ?tipo ?sumario ?estado ?entidades ?entidades1 ?fonte ?link ?aprovou WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado ?estado.

        OPTIONAL {
            ?uri clav:aprovou ?aprovou.
        }
        OPTIONAL {
          ?uri clav:diplomaLink ?link.
        }
        OPTIONAL {
        	?uri clav:diplomaFonte ?fonte.
        }
        OPTIONAL {
        	?uri clav:diplomaDataRevogacao ?dataRevogacao.
        }
        OPTIONAL {
            ?uri clav:temEntidadeResponsavel ?ent.
            BIND(STRAFTER(STR(?ent), '#') AS ?entidades).
        }
        OPTIONAL {
          ?uri clav:temEntidade ?ent1.
          BIND(STRAFTER(STR(?ent1), '#') AS ?entidades1).
        }
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).
    } ORDER BY DESC (?data)`;
  const campos = [
    "id",
    "data",
    "dataRevogacao",
    "numero",
    "tipo",
    "sumario",
    "estado",
    "fonte",
    "aprovou",
    "link",
  ];
  const agrupar = ["entidades", "entidades1"];

  return execQuery("query", query).then((response) => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades
        .filter((e) => !!e)
        .map((ent) =>
          ent
            ? {
                id: ent,
                sigla: ent.includes("ent_")
                  ? ent.split("ent_")[1]
                  : ent.split("tip_")[1],
              }
            : ""
        );
      leg.entidades1 = leg.entidades1
        .filter((e) => !!e)
        .map((ent) =>
          ent
            ? {
                id: ent,
                sigla: ent.includes("ent_")
                  ? ent.split("ent_")[1]
                  : ent.split("tip_")[1],
              }
            : ""
        );
    }

    return legs;
  });
};

//Lista todas as legislações consoante o estado
Leg.listarPorEstado = (estado) => {
  const query = `SELECT ?id ?data ?dataRevogacao ?numero ?tipo ?sumario ?entidades ?fonte ?link WHERE {
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
        	?uri clav:diplomaDataRevogacao ?dataRevogacao.
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
    "dataRevogacao",
    "numero",
    "tipo",
    "sumario",
    "fonte",
    "link",
  ];
  const agrupar = ["entidades"];

  return execQuery("query", query).then((response) => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map((ent) => ({
        id: `ent_${ent}`,
        sigla: ent,
      }));
      leg.estado = estado;
    }

    return legs;
  });
};

// Lista todas as legislações com PNs associados
Leg.listarComPNs = () => {
  const query = `SELECT ?id ?data ?dataRevogacao ?numero ?tipo ?sumario ?estado ?entidades ?fonte ?link WHERE {
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
        	?uri clav:diplomaDataRevogacao ?dataRevogacao.
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
    "dataRevogacao",
    "numero",
    "tipo",
    "sumario",
    "estado",
    "fonte",
    "link",
  ];
  const agrupar = ["entidades"];

  return execQuery("query", query).then((response) => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map((ent) => ({
        id: `ent_${ent}`,
        sigla: ent,
      }));
    }

    return legs;
  });
};

// Lista todas as legislações sem PNs associados
Leg.listarSemPNs = () => {
  const query = `SELECT ?id ?data ?dataRevogacao ?numero ?tipo ?sumario ?estado ?entidades ?fonte ?link WHERE {
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
        	?uri clav:diplomaDataRevogacao ?dataRevogacao.
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
    "dataRevogacao",
    "numero",
    "tipo",
    "sumario",
    "estado",
    "fonte",
    "link",
  ];
  const agrupar = ["entidades"];

  return execQuery("query", query).then((response) => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map((ent) => ({
        id: `ent_${ent}`,
        sigla: ent,
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
            id: "c" + codigos[j],
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
Leg.consultar = (id) => {
  const query = `SELECT ?tipo ?data ?dataRevogacao ?numero ?sumario ?link ?estado ?fonte ?entidades ?entidades1 WHERE { 
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
        	clav:${id} clav:diplomaDataRevogacao ?dataRevogacao.
        }
        OPTIONAL {
            clav:${id} clav:temEntidadeResponsavel ?ent.
            BIND(STRAFTER(STR(?ent), '#') AS ?entidades).
        }
        OPTIONAL {
          clav:${id} clav:temEntidade ?ent1.
          BIND(STRAFTER(STR(?ent1), '#') AS ?entidades1).
        }
     }`;
  const campos = [
    "id",
    "data",
    "dataRevogacao",
    "numero",
    "tipo",
    "sumario",
    "link",
    "estado",
    "fonte",
  ];
  const agrupar = ["entidades", "entidades1"];

  return execQuery("query", query).then((response) => {
    var leg = projection(normalize(response), campos, agrupar)[0];
    leg.entidades = leg.entidades
      .filter((e) => !!e)
      .map((ent) =>
        ent
          ? {
              id: ent,
              sigla: ent.includes("ent_")
                ? ent.split("ent_")[1]
                : ent.split("tip_")[1],
            }
          : ""
      );
    leg.entidades1 = leg.entidades1
      .filter((e) => !!e)
      .map((ent) =>
        ent
          ? {
              id: ent,
              sigla: ent.includes("ent_")
                ? ent.split("ent_")[1]
                : ent.split("tip_")[1],
            }
          : ""
      );
    return leg;
  });
};

/**
 * Verifica se um determinado numero de legislação existe no sistema.
 *
 * @param {Legislacao} legislacao
 * @return {Promise<boolean | Error>}
 */
Leg.existe = (numero) => {
  const query = `ASK {
            ?e clav:diplomaNumero '${numero}'
        }`;

  return execQuery("query", query).then((response) => response.boolean);
};

/**
 * Verifica se um determinado numero de legislação existe no sistema.
 *
 * @param {Legislacao} legislacao
 * @return {Promise<boolean | Error>}
 */
Leg.existeId = (numero) => {
  const query = `select ?s where {
            ?s clav:diplomaNumero '${numero}'
        }`;

  return execQuery("query", query).then((response) => {
    var res = normalize(response)[0];
    if (res) res = res.s.split("#")[1];
    return res;
  });
};

/**
 * Verifica se uma determinada legislação tem PNs associados.
 *
 * @param {Legislacao} legislacao
 * @return {Promise<boolean | Error>}
 */
Leg.temPNs = (legislacao) => {
  const query = `ASK {
        ?e clav:temLegislacao clav:'${legislacao.id}'
        }`;

  return execQuery("query", query).then((response) => response.boolean);
};

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
Leg.regula = (id) => {
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
  return execQuery("query", query).then((response) => normalize(response));
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

  return execQuery("query", query).then((response) => normalize(response));
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
Leg.listarFonte = (fonte) => {
  const query = `SELECT ?id ?data ?dataRevogacao ?numero ?tipo ?sumario ?estado ?entidades ?link WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado ?estado;
             clav:diplomaLink ?link;
             clav:diplomaFonte "${fonte}".
        OPTIONAL {
            ?uri clav:temEntidadeResponsavel ?ent.
            ?ent clav:entSigla ?entidades;
        }
        OPTIONAL {
        	?uri clav:diplomaDataRevogacao ?dataRevogacao.
        }
        FILTER (?estado = "Ativo")
        
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).
    } ORDER BY DESC (?data)`;
  const campos = [
    "id",
    "data",
    "dataRevogacao",
    "numero",
    "tipo",
    "sumario",
    "estado",
    "link",
  ];
  const agrupar = ["entidades"];

  return execQuery("query", query).then((response) => {
    let legs = projection(normalize(response), campos, agrupar);

    for (leg of legs) {
      leg.entidades = leg.entidades.map((ent) => ({
        id: `ent_${ent}`,
        sigla: ent,
      }));
      leg.fonte = fonte;
    }

    return legs;
  });
};

//Obtém o resto da info das Legislacoes
Leg.moreInfoList = async (legs) => {
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
Leg.moreInfo = async (leg) => {
  leg.regula = await Leg.regula(leg.id);
};

//Cria legislação em triplos dado um objeto legislação
function queryLeg(id, leg) {
  if (!id) {
    const nanoid = require("nanoid");
    id = "leg_" + nanoid();
  }

  let baseQuery = `clav:${id} rdf:type owl:NamedIndividual, clav:Legislacao ;
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
    baseQuery += ` ;\n\tclav:temEntidadeResponsavel ${leg.entidadesSel
      .map((ent) => `clav:${ent.id}`)
      .join(", ")}`;
  }

  baseQuery += ".\n";
  if (leg.processosSel) {
    baseQuery += leg.processosSel
      .map((proc) => `clav:c${proc.codigo} clav:temLegislacao clav:${id}`)
      .join(".\n");
  }

  return baseQuery;
}

//Criar legislação
Leg.criar = async (leg) => {
  const baseQuery = queryLeg(leg.id, leg);
  const query = `INSERT DATA {${baseQuery}}`;
  const ask = `ASK {${baseQuery}}`;

  return execQuery("update", query).then((res) =>
    execQuery("query", ask).then((result) => {
      if (result.boolean) return "Sucesso na inserção da legislação";
      else throw "Insucesso na inserção da legislação";
    })
  );
};

//Atualizar legislação
Leg.atualizar = async (id, leg) => {
  let baseQuery = queryLeg(id, leg);

  if (leg.dataRevogacao)
    baseQuery += `.\nclav:${id} clav:diplomaDataRevogacao "${leg.dataRevogacao}".`;

  try {
    var triplesLeg = await allTriplesFrom(id);
    triplesLeg += await triplesRelObj("temLegislacao", id);
    var query = `DELETE {${triplesLeg}}`;
    query += `INSERT {${baseQuery}}`;
    query += `WHERE {${triplesLeg}}`;
    await execQuery("update", query);
    return "Sucesso na atualização do diploma legislativo";
  } catch (e) {
    throw "Insucesso na atualização do diploma legislativo";
  }
};

//Revogar legislação
Leg.revogar = async (id, dataRevogacao) => {
  var deleteLeg = `clav:${id} clav:diplomaEstado ?o.`;
  deleteLeg += await triplesRelSuj(id, "diplomaDataRevogacao");

  var queryLeg = `{
        clav:${id} clav:diplomaDataRevogacao "${dataRevogacao}";
            clav:diplomaEstado "Revogado".
    }`;
  const query =
    "DELETE {" +
    deleteLeg +
    "} INSERT " +
    queryLeg +
    "WHERE {" +
    deleteLeg +
    "}";
  const ask = "ASK " + queryLeg;

  return execQuery("update", query).then((res) =>
    execQuery("query", ask).then((result) => {
      if (result.boolean) return "Legislação revogada";
      else throw "Não foi possível revogar a legislação";
    })
  );
};
