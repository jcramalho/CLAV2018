const execQuery = require("../../controllers/api/utils").execQuery;
const normalize = require("../../controllers/api/utils").normalize;
const request = require("../../controllers/api/utils").request;
const Entidades = module.exports;

/**
 * @typedef {Object} Entidade
 * @property {string} id (ex: "ent_AR")
 * @property {string} sigla (ex: "AR")
 * @property {string} designacao (ex: "Assembleia da República")
 * @property {string} internacional (ex: "Sim" ou "Não")
 * @property {string} sioe  (id para sistema SIOE)
 * @property {string} estado (ex: "Ativa", "Inativa" ou "Harmonização")
 */

/**
 * Lista as meta informações de todas as entidades no sistema, de acordo
 * com o filtro especificado.
 *
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado.
 * @param {string} filtro.sigla (ex: "AR")
 * @param {string} filtro.designacao (ex: "Assembleia da República")
 * @param {string} filtro.internacional (ex: "Sim" ou "Não")
 * @param {string} filtro.sioe (ex: "875780390")
 * @param {string} filtro.estado (ex: "Ativa", "Inativa" ou "Harmonização")
 * @return {Promise<[Entidade] | Error>} promessa que quando cumprida contém a
 * lista das entidades existentes que respeitam o filtro dado
 */
Entidades.listar = filtro => {
  const query = `SELECT ?id ?sigla ?designacao ?internacional ?sioe ?estado {
        ?uri rdf:type clav:Entidade ;
            clav:entEstado ?estado;
            clav:entDesignacao ?designacao ;
            clav:entSigla ?sigla ;
            clav:entInternacional ?internacional .
        OPTIONAL {
            ?uri clav:entSIOE ?sioe.
        }
        BIND(CONCAT('ent_', ?sigla) AS ?id).

        FILTER (${filtro})
    } ORDER BY ?sigla`;

  return execQuery("query", query).then(response => normalize(response));
};

//Lista tipologias e donos de todas as entidades
Entidades.listarTipsDonos = async () => {
  const query = `SELECT ?sigla
                        (GROUP_CONCAT(DISTINCT ?tipSigla; SEPARATOR="#") AS ?ts)
                        (GROUP_CONCAT(DISTINCT ?tipDesignacao; SEPARATOR="#") AS ?td)
                        (GROUP_CONCAT(DISTINCT ?donoCodigo; SEPARATOR="#") AS ?dc)
                        (GROUP_CONCAT(DISTINCT ?donoTitulo; SEPARATOR="#") AS ?dt) {

        ?uri rdf:type clav:Entidade ;
            clav:entSigla ?sigla .
		
    	OPTIONAL {
        	?uri clav:pertenceTipologiaEnt ?uriT .
        	?uriT clav:tipEstado "Ativa";
            	clav:tipSigla ?tipSigla;
                clav:tipDesignacao ?tipDesignacao.
    	}

    	OPTIONAL{
        	?do clav:temDono ?uri;
            	clav:codigo ?donoCodigo ;
                clav:titulo ?donoTitulo ;
            	clav:pertenceLC clav:lc1 ;
            	clav:classeStatus "A" .
    	}
    }
    group by ?sigla`;

  try {
    var response = await execQuery("query", query);
    var res = normalize(response);

    for (var i = 0; i < res.length; i++) {
      res[i].tipologias = [];
      res[i].dono = [];

      if (res[i].ts != "") {
        var siglas = res[i].ts.split("#");
        var desigs = res[i].td.split("#");

        for (var j = 0; j < siglas.length; j++) {
          res[i].tipologias.push({
            sigla: siglas[j],
            designacao: desigs[j],
            id: "tip_" + siglas[j]
          });
        }
      }

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

      delete res[i].ts;
      delete res[i].td;

      delete res[i].dc;
      delete res[i].dt;

      res[i].dono.sort((p1, p2) => p1.codigo.localeCompare(p2.codigo));
    }

    return res;
  } catch (erro) {
    throw erro;
  }
};

//Lista participantes de todas as entidades
Entidades.listarParticipantes = async () => {
  const query = `SELECT ?sigla
                        (GROUP_CONCAT(?parCodigo; SEPARATOR="#") AS ?pc)
                        (GROUP_CONCAT(?parTitulo; SEPARATOR="#") AS ?pt)
                        (GROUP_CONCAT(?tipoP; SEPARATOR="#") AS ?tp) {

        ?uri rdf:type clav:Entidade ;
    		clav:entSigla ?sigla .
    
    	OPTIONAL{
        	?uriP clav:temParticipante ?uri;
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
      res[i].participante.sort((p1, p2) => p1.codigo.localeCompare(p2.codigo));
    }

    return res;
  } catch (erro) {
    throw erro;
  }
};

// Lista todas as entidades com PNs associados (como Dono ou como Participante)
Entidades.listarComPNs = filtro => {
  const query = `SELECT ?id ?sigla ?designacao ?internacional ?sioe ?estado 
    WHERE { 
            ?uri rdf:type clav:Entidade ;
                clav:entEstado ?estado;
                clav:entDesignacao ?designacao ;
                clav:entSigla ?sigla ;
                clav:entInternacional ?internacional .
            OPTIONAL {
                ?uri clav:entSIOE ?sioe.
            } 
            {
        FILTER EXISTS { ?pn clav:temDono ?uri. }
        FILTER EXISTS { ?pn clav:temParticipante ?uri. }
            
        } UNION {
            {
        FILTER NOT EXISTS { ?pn clav:temDono ?uri. }
        FILTER EXISTS { ?pn clav:temParticipante ?uri. }
            }
        } UNION {
            {
        FILTER EXISTS { ?pn clav:temDono ?uri. }
        FILTER NOT EXISTS { ?pn clav:temParticipante ?uri. }
            }
        } BIND(CONCAT('ent_', ?sigla) AS ?id).
        FILTER (${filtro})
    } ORDER BY ?sigla`;

  return execQuery("query", query).then(response => normalize(response));
};

// Lista todas as entidades sem PNs associados (como Dono ou como Participante)
Entidades.listarSemPNs = filtro => {
  const query = `SELECT ?id ?sigla ?designacao ?internacional ?sioe ?estado {
            ?uri rdf:type clav:Entidade ;
                clav:entEstado ?estado;
                clav:entDesignacao ?designacao ;
                clav:entSigla ?sigla ;
                clav:entInternacional ?internacional .
            OPTIONAL {
                ?uri clav:entSIOE ?sioe.
            }
        FILTER NOT EXISTS {?pn clav:temDono ?uri.}
        FILTER NOT EXISTS {?pn clav:temParticipante ?uri.}
            BIND(CONCAT('ent_', ?sigla) AS ?id).
        FILTER (${filtro})
        } ORDER BY ?sigla`;

  return execQuery("query", query).then(response => normalize(response));
};

/**
 * Devolve a lista das tipologias às quais uma entidade pertence.
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<[{sigla: string, designacao: string}] | Error>} promessa
 * que quando cumprida contém uma lista das siglas e designações das tipologias
 * às quais a entidade pertence
 */
Entidades.tipologias = id => {
  const query = `SELECT ?id ?sigla ?designacao WHERE {
        clav:${id} clav:pertenceTipologiaEnt ?uri .
        ?uri clav:tipEstado "Ativa";
            clav:tipSigla ?sigla;
            clav:tipDesignacao ?designacao.
        BIND (CONCAT('tip_', ?sigla) AS ?id)
    }`;

  return execQuery("query", query).then(response => normalize(response));
};

/**
 * Consulta a meta informação relativa a uma entidade (sigla, designação,
 * estado e internacional).
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<Entidade | Error>} promessa que quando cumprida contém a
 * entidade que corresponde ao identificador dado. Se a entidade não existir
 * então a promessa conterá o valor `undefined`
 */
Entidades.consultar = id => {
  const query = `SELECT ?sigla ?designacao ?estado ?internacional ?sioe ?dataCriacao ?dataExtincao WHERE {
        clav:${id} rdf:type clav:Entidade ;
            clav:entDesignacao ?designacao ;
            clav:entSigla ?sigla ;
            clav:entEstado ?estado ;
            clav:entInternacional ?internacional .
        OPTIONAL {
            clav:${id} clav:entSIOE ?sioe
        }
        OPTIONAL {
            clav:${id} clav:entDataCriacao ?dataCriacao
        }
        OPTIONAL {
            clav:${id} clav:entDataExtincao ?dataExtincao
        }
    }`;

  return execQuery("query", query).then(response => normalize(response)[0]);
};

/**
 * Verifica se uma determinada entidade existe no sistema.
 *
 * @param {Entidade} entidade
 * @return {Promise<boolean | Error>}
 */
Entidades.existe = entidade => {
  const query = `ASK {
        { ?e clav:entDesignacao|clav:tipDesignacao '${entidade.designacao}' }
        UNION
        { ?s clav:entSigla|clav:tipSigla '${entidade.sigla}' }
    }`;

  return execQuery("query", query).then(response => response.boolean);
};

/**
 * Verifica se uma determinada sigla de entidade existe no sistema.
 *
 * @param {Sigla} sigla
 * @return {Promise<boolean | Error>}
 */
Entidades.existeSigla = sigla => {
  const query = `ASK {
      ?s clav:entSigla|clav:tipSigla '${sigla}' 
  }`;

  return execQuery("query", query).then(response => response.boolean);
};

/**
 * Verifica se uma determinada designacao de entidade existe no sistema.
 *
 * @param {Designacao} designacao
 * @return {Promise<boolean | Error>}
 */
Entidades.existeDesignacao = designacao => {
  const query = `ASK {
      ?e clav:entDesignacao|clav:tipDesignacao '${designacao}' 
  }`;

  return execQuery("query", query).then(response => response.boolean);
};

/**
 * Lista os processos em que uma entidade intervem como dona.
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<{codigo: string, titulo: string} | Error>} promessa que
 * quando cumprida contém os códigos e títulos dos processos onde a entidade
 * participa como dona
 */
Entidades.dono = id => {
  const query = `SELECT ?codigo ?titulo WHERE {
        ?id clav:temDono clav:${id} ;
            clav:codigo ?codigo ;
            clav:titulo ?titulo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
    }ORDER BY ?codigo`;

  return execQuery("query", query).then(response => normalize(response));
};

/**
 * Lista os processos em que uma entidade intervem como participante.
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<[{codigo: string, titulo: string}] | Error>} promessa que
 * quando cumprida contém os códigos e títulos dos processos onde a entidade
 * participa
 */
Entidades.participante = id => {
  const query = `SELECT ?tipoPar ?codigo ?titulo WHERE { 
        ?uri clav:temParticipante clav:${id} ;
            ?tipoParURI clav:${id} ;
            clav:titulo ?titulo ;
            clav:codigo ?codigo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
        BIND (STRAFTER(STR(?tipoParURI), 'clav#') AS ?tipoPar).
        FILTER (?tipoParURI != clav:temParticipante && ?tipoParURI != clav:temDono)
    }ORDER BY ?codigo`;

  return execQuery("query", query).then(response => normalize(response));
};

//Obtém o resto da info das Entidades
Entidades.moreInfoList = async ents => {
  //obtém as tipologias e os donos para todas as entidades
  var data = await Entidades.listarTipsDonos();
  var tipsDonos = [];

  for (var i = 0; i < data.length; i++) {
    tipsDonos[data[i].sigla] = {
      tipologias: data[i].tipologias,
      dono: data[i].dono
    };
  }

  //obtém os participantes e o tipo de participação para todas as entidades
  data = await Entidades.listarParticipantes();
  var parts = [];

  for (i = 0; i < data.length; i++) {
    parts[data[i].sigla] = {
      participante: data[i].participante,
      tipoPar: data[i].tipoPar
    };
  }

  for (i = 0; i < ents.length; i++) {
    ents[i].tipologias = tipsDonos[ents[i].sigla].tipologias;
    ents[i].dono = tipsDonos[ents[i].sigla].dono;
    ents[i].participante = parts[ents[i].sigla].participante;
    ents[i].tipoPar = parts[ents[i].sigla].tipoPar;
  }
};

//Obtém o resto da info da Entidade
Entidades.moreInfo = async ent => {
  var id = "ent_" + ent.sigla;

  ent.tipologias = await Entidades.tipologias(id);
  ent.dono = await Entidades.dono(id);
  ent.participante = await Entidades.participante(id);
};

//Criar entidade
Entidades.criar = async ent => {
  var queryEnt = `{ 
    clav:ent_${ent.sigla} rdf:type owl:NamedIndividual, clav:Entidade ;
        clav:entEstado "${ent.estado}" ;
        clav:entSigla "${ent.sigla}" ;
        clav:entDesignacao "${ent.designacao}"`;

  if (ent.sioe) queryEnt += ` ;\n\tclav:entSIOE "${ent.sioe}"`;

  if (ent.internacional !== null && ent.internacional !== undefined) {
    ent.internacional = ent.internacional === "" ? "Não" : ent.internacional;
  } else {
    ent.internacional = "Não";
  }
  queryEnt += ` ;\n\tclav:entInternacional "${ent.internacional}"`;

  if (ent.dataCriacao)
    queryEnt += ` ;\n\tclav:entDataCriacao "${ent.dataCriacao}"`;

  if (
    ent.tipologiasSel &&
    ent.tipologiasSel instanceof Array &&
    ent.tipologiasSel.length > 0
  )
    queryEnt += ` ;\n\tclav:pertenceTipologiaEnt ${ent.tipologiasSel
      .map(tip => `clav:tip_${tip.sigla}`)
      .join(", ")}`;

  queryEnt += " .\n}";
  const query = "INSERT DATA " + queryEnt;
  const ask = "ASK " + queryEnt;

  if (
    (await Entidades.existeSigla(ent.sigla)) ||
    (await Entidades.existeDesignacao(ent.designacao))
  ) {
    throw "Entidade já existe, sigla ou designação já em uso.";
  } else {
    return execQuery("update", query).then(res =>
      execQuery("query", ask).then(result => {
        if (result.boolean) return "Sucesso na inserção da entidade";
        else throw "Insucesso na inserção da entidade";
      })
    );
  }
};

//Extinguir entidade
Entidades.extinguir = (id, dataExtincao) => {
  var deleteEnt = `{
        clav:${id} clav:entEstado ?o.
    }`;
  var queryEnt = `{ 
        clav:${id} clav:entDataExtincao "${dataExtincao}";
            clav:entEstado "Inativa".
    }`;
  const query =
    "DELETE " + deleteEnt + " INSERT " + queryEnt + "WHERE " + deleteEnt;
  const ask = "ASK " + queryEnt;

  return execQuery("update", query).then(res =>
    execQuery("query", ask).then(result => {
      if (result.boolean) return "Entidade extinta";
      else throw "Não foi possível extinguir a entidade";
    })
  );
};
