const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
var Pedidos = require('../../controllers/api/pedidos');

var AutosEliminacao = module.exports

AutosEliminacao.listar = async function() {
    let query = `
    SELECT ?id ?data ?entidade ?legislacao ?fundo WHERE {
        ?id a clav:AutoEliminacao;
                clav:autoDataAutenticacao ?data;
                clav:temEntidadeResponsavel ?entidade ;
                clav:autoLegislacao ?legislacao ;
                clav:fundo ?fundo .
    } 
    `
    try {
        let result = await execQuery("query", query);
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

AutosEliminacao.consultar = async function(id) {
    var query = `
    SELECT * WHERE {
        clav:${id} a clav:AutoEliminacao;
                clav:autoDataAutenticacao ?data;
                clav:autoResponsavel ?resp ;
                clav:temEntidadeResponsavel ?entidade ;
                clav:autoLegislacao ?legislacao ;
                clav:fundo ?fundo ;
                   clav:temZonaControlo ?zc .
        ?zc clav:codigo ?codigo ;
            clav:autoDataInicio ?dataInicio;
            clav:autoDataFim ?dataFim;
            clav:temAgregacao ?ag .
    	?ag clav:agregacaoCodigo ?agCodigo ;
            clav:agregacaoTitulo ?agTitulo ;
            clav:agregacaoDataContagem ?agData.
        OPTIONAL {
            ?zc clav:temNI ?zcNI .
        }
        OPTIONAL {
            ?zc clav:temDono ?dono .
        }
        OPTIONAL {
            ?ag clav:temNI ?agNI .
        }
        OPTIONAL {
            ?zc clav:referencia ?referencia .
        }
    }
    `
    try {
        return execQuery("query", query)
            .then(response => {
                if(normalize(response).length === 0) return []
                var autos = normalize(response)
                var res = {
                    id: id,
                    data: autos[0].data,
                    entidade: autos[0].entidade,
                    responsavel: autos[0].resp,
                    legislacao: autos[0].legislacao,
                    fundo: autos[0].fundo,
                    zonaControlo: {}
                }
                for(ae of autos) {
                    if(!(ae.codigo in res.zonaControlo)) {
                        res.zonaControlo[ae.codigo] = {
                            codigo: ae.codigo,
                            referencia: ae.referencia,
                            dataInicio: ae.dataInicio,
                            dataFim: ae.dataFim,
                            dono: ae.dono,
                            ni: ae.zcNI,
                            ag: {}
                        }

                    }
                    res.zonaControlo[ae.codigo].ag[ae.agCodigo] = {
                        codigo: ae.agCodigo,
                        titulo: ae.agTitulo,
                        dataContagem: ae.agData,
                        ni: ae.agNI
                    }
                }
                return res
            });
    } 
    catch(erro) { throw (erro);}
}

AutosEliminacao.adicionarTS = async function (auto) {
    const nanoid = require('nanoid')
    //Invariante Legislação
    var tipo = auto.legislacao.split(' ')[0]
    var numero = auto.legislacao.split(' ')[1]
    var queryLeg = `
        ASK {
            ?leg a clav:Legislacao;
            	:diplomaTipo ${tipo};
              	:diplomaNumero ${numero} .
        }
    `
    var queryEnt = `
        SELECT * WHERE {
            ?ent a clav:Entidade ;
                 clav:entDesignacao ${auto.entidade} .
        }
    `
    try {
        let resultLeg = execQuery("query", queryLeg)
        let resultEnt = normalize(execQuery("query", queryEnt));
        if(resultLeg.boolean && (resultEnt.length > 0)) {
            var id = "ae_"+nanoid();
            var data = currentTime.getDate()+"/"+(currentTime.getMonth()+1)+"/"+currentTime.getFullYear()
            var query = `
                INSERT DATA {
                    clav:${id} a clav:AutoEliminacao ;
                               clav:autoNumero "${id}" ;
                               clav:autoDataAutenticacao "${data}" ;
                               clav:autoResponsavel "${auto.responsavel}" ;
                               clav:autoLegislacao "${auto.legislacao}" ;
                               clav:fundo "${auto.fundo}" ;
                               clav:temEntidadeResponsavel :${resultEnt.split("#")[1]} .
            `
            for(zona of auto.zonaControlo) {
                var idZona = ":zc_"+nanoid();
                query += `
                    clav:${id} clav:temZonaControlo clav:${idZona} .
                `
                query += `
                    clav:${idZona} a clav:ZonaControlo ;
                    clav:codigo "${zona.codigo}" ;`
                if(zona.ni.lowerCase() === "dono") query += `
                   clav:temNI clav:vc_naturezaIntervencao_dono ;`
                else if(zona.ni.lowerCase() === "participante") query += `
                   clav:temNI clav:vc_naturezaIntervencao_participante ;`
                if(zona.dono !== "") query += `
                     clav:temDono :ent_${zona.dono} ;`
                
                query += `
                    clav:autoDataInicio "${zona.dataInicio}" ;
                    clav:autoDataFim "${zona.dataInicio}" .
                `
                for(agregacao of zona.agregacoes) {
                    var idAg = ":ag_"+agregacao.codigo
                    query += `
                        clav:${idZona} clav:temAgregacao clav:${idAg} .
                    `
                    query += `
                        clav:${idAg} a :Agregacao ;
                            clav:agregacaoCodigo "${agregacao.codigo}" ;
                            clav:agregacaoTitulo "${agregacao.titulo}" ;
                    `
                    if(agregacao.ni.lowerCase() === "dono") query += `
                        clav:temNI clav:vc_naturezaIntervencao_dono ;`
                    else if(agregacao.ni.lowerCase() === "participante") query += `
                        clav:temNI clav:vc_naturezaIntervencao_participante ;`
                    
                    query += `
                        clav:agregacaoDataContagem "${agregacao.dataContagem}" .
                    `
                }
            }
            return execQuery("update", query)
                    .then(response => normalize(response));
        }
    } 
    catch(erro) { throw (erro);}
}


AutosEliminacao.adicionarPGD = async function (auto) {
    const nanoid = require('nanoid')
    var currentTime = new Date()
    var queryEnt = `
        SELECT ?ent WHERE {
            ?ent a clav:Entidade ;
                 clav:entDesignacao "${auto.entidade}" .
        }
    `
    try {
        let resultEnt = await execQuery("query", queryEnt);
        resultEnt = normalize(resultEnt)
        if(resultEnt.length > 0) {
            var id = "ae_"+nanoid();
            var data = currentTime.getDate()+"/"+(currentTime.getMonth()+1)+"/"+currentTime.getFullYear()
            var query = `
                    clav:${id} a clav:AutoEliminacao ;
                               clav:autoNumero "${id}" ;
                               clav:autoDataAutenticacao "${data}" ;
                               clav:autoResponsavel "${auto.responsavel}" ;
                               clav:autoLegislacao "${"Portaria "+auto.legislacao}" ;
                               clav:fundo "${auto.fundo}" ;
                               clav:temEntidadeResponsavel clav:${resultEnt[0].ent.split("#")[1]} .
            `
            
            for(zona of auto.zonaControlo) {
                var idZona = "zc_"+nanoid();

                query += `
                    clav:${id} clav:temZonaControlo clav:${idZona} .
                `
                query += `
                    clav:${idZona} a clav:ZonaControlo ;
                        clav:codigo "${zona.codigo}" ;`
                if(zona.uiPapel !== "")
                    query += `
                    clav:medicaoPapel "${zona.uiPapel}" ;`
                if(zona.uiDigital !== "")
                    query += `
                    clav:medicaoDigital "${zona.uiDigital}" ;`
                if(zona.uiOutros !== "")
                    query += `
                    clav:medicaoOutros "${zona.uiOutros}" ;`
                query += `
                        clav:autoDataInicio "${zona.dataInicio}" ;
                        clav:autoDataFim "${zona.dataFim}" .
                `
                for(agregacao of zona.agregacoes) {
                    var idAg = "ag_"+zona.codigo+'_'+agregacao.codigo
                    query += `
                        clav:${idZona} clav:temAgregacao clav:${idAg} .
                    
                        clav:${idAg} a clav:Agregacao ;
                            clav:agregacaoCodigo "${agregacao.codigo}" ;
                            clav:agregacaoTitulo "${agregacao.titulo}" ;`
                    
                    if(agregacao.ni.toLowerCase() === "dono") query += `
                        clav:temNI clav:vc_naturezaIntervencao_dono ;`
                    else if(agregacao.ni.toLowerCase() === "participante") query += `
                        clav:temNI clav:vc_naturezaIntervencao_participante ;`
                    
                    query += `
                        clav:agregacaoDataContagem "${agregacao.dataContagem}" .
                    `
                }
            }
            try {
                var insert = "INSERT DATA {\n"+query+"\n}"
                await execQuery("update", insert)
                // O ASK demora 1.6s não premite fazer return
                // try {
                    
                //     var ask = "ASK {\n" + query + "\n}"
                //     let result = await execQuery("update", ask);
                //     console.log("res: "+result.boolean)
                //     return result.boolean
                // }
                // catch(erro) { throw (erro); }
                return true
            }
            catch(erro) { throw (erro);}
        }
    } 
    catch(erro) { throw (erro);}
}

AutosEliminacao.adicionarRADA = async function (auto) {
    const nanoid = require('nanoid')
    var currentTime = new Date()
    var queryEnt = `
        SELECT ?ent WHERE {
            ?ent a clav:Entidade ;
                 clav:entDesignacao "${auto.entidade}" .
        }
    `
    try {
        let resultEnt = await execQuery("query", queryEnt);
        resultEnt = normalize(resultEnt)

        if(resultEnt.length > 0) {
            var id = "ae_"+nanoid();
            var data = currentTime.getDate()+"/"+(currentTime.getMonth()+1)+"/"+currentTime.getFullYear()
            var query = `
                    clav:${id} a clav:AutoEliminacao ;
                               clav:autoNumero "${id}" ;
                               clav:autoDataAutenticacao "${data}" ;
                               clav:autoResponsavel "${auto.responsavel}" ;
                               clav:autoLegislacao "${auto.legislacao}" ;
                               clav:fundo "${auto.fundo}" ;
                               clav:temEntidadeResponsavel clav:${resultEnt[0].ent.split("#")[1]} .
            `
            
            for(zona of auto.zonaControlo) {
                var idZona = "zc_"+nanoid();

                query += `
                    clav:${id} clav:temZonaControlo clav:${idZona} .
                `
                query += `
                    clav:${idZona} a clav:ZonaControlo ;
                        clav:codigo "${zona.codigo + "_" + zona.referencia}" ;`
                if(zona.uiPapel !== "")
                    query += `
                    clav:medicaoPapel "${zona.uiPapel}" ;`
                if(zona.uiDigital !== "")
                    query += `
                    clav:medicaoDigital "${zona.uiDigital}" ;`
                if(zona.uiOutros !== "")
                    query += `
                    clav:medicaoOutros "${zona.uiOutros}" ;`
                query += `
                        clav:autoDataInicio "${zona.dataInicio}" ;
                        clav:autoDataFim "${zona.dataFim}" .
                `

                for(agregacao of zona.agregacoes) {
                    var idAg = "ag_"+zona.codigo+'_'+agregacao.codigo
                    query += `
                        clav:${idZona} clav:temAgregacao clav:${idAg} .
                    
                        clav:${idAg} a clav:Agregacao ;
                            clav:agregacaoCodigo "${agregacao.codigo}" ;
                            clav:agregacaoTitulo "${agregacao.titulo}" ;`
                    
                    if(agregacao.ni.toLowerCase() === "dono") query += `
                        clav:temNI clav:vc_naturezaIntervencao_dono ;`
                    else if(agregacao.ni.toLowerCase() === "participante") query += `
                        clav:temNI clav:vc_naturezaIntervencao_participante ;`
                    
                    query += `
                        clav:agregacaoDataContagem "${agregacao.dataContagem}" .
                    `
                }
            }
            try {
                var insert = "INSERT DATA {\n"+query+"\n}"
                await execQuery("update", insert)
                // O ASK demora 1.6s não premite fazer return
                // try {
                    
                //     var ask = "ASK {\n" + query + "\n}"
                //     let result = await execQuery("update", ask);
                //     console.log("res: "+result.boolean)
                //     return result.boolean
                // }
                // catch(erro) { throw (erro); }
                return true
            }
            catch(erro) { throw (erro);}
        }
    } 
    catch(erro) { throw (erro);}
}

// ============================================================================

/**
 * Insere um novo Auto de Eliminação no sistema, gerando um pedido apropriado.
 * O Auto de Eliminação criado encontrar-se-á no estado "Harmonização".
 * 
 * @see pedidos
 *
 * @param {AutoEliminacao} auto que se pretende criar
 * @param {string} utilizador identificação do utilizador que criou o auto
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a criação da nova classe
 */
AutosEliminacao.importar = async (auto, tipo, user) => {    
    auto.entidade = user.entidade
    auto.responsavel = user.name
    var pedido = {
        tipoPedido: "Importação",
        tipoObjeto: tipo,
        novoObjeto: {
            ae: auto
        },
        user: {
            email: user.email
        },
        entidade: user.entidade
    }
    var pedido = await Pedidos.criar(pedido)
    return {codigo: pedido.codigo, auto: auto }
};

/**
 * Insere um novo Auto de Eliminação no sistema, gerando um pedido apropriado.
 * O Auto de Eliminação criado encontrar-se-á no estado "Harmonização".
 * 
 * @see pedidos
 *
 * @param {AutoEliminacao} auto que se pretende criar
 * @param {string} utilizador identificação do utilizador que criou o auto
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a criação da nova classe
 */
AutosEliminacao.criar = async (auto, userName, userEmail) => {
    var queryEnt = `
        SELECT ?ent WHERE {
            ?ent a clav:Entidade ;
                 clav:entDesignacao "${auto.entidade}" .
        }
    `
    var queryFundo = `
        SELECT ?ent WHERE {
            ?ent a clav:Entidade ;
                clav:entDesignacao "${auto.fundo}" .
        }
    `
    try {
        let resultEnt = await execQuery("query", queryEnt);
        let resultFundo = await execQuery("query",queryFundo);
        resultEnt = normalize(resultEnt)
        resultFundo = normalize(resultFundo)
        if(resultEnt.length > 0) {
          if(resultFundo.length > 0) {
            auto.responsavel = userName
            var pedido = {
                tipoPedido: "Criação",
                tipoObjeto: "Auto de Eliminação",
                novoObjeto: {
                    ae: auto
                },
                user: {
                    email: userEmail
                },
                entidade: resultEnt[0].ent.split("#")[1]
            }
            var pedido = await Pedidos.criar(pedido)
            return {codigo: pedido.codigo, auto: auto }
          }
          else throw(`Entidade responsável pelo Fundo, "${auto.fundo}", não encontrada no sistema.`)
        }
        else throw(`Entidade ${auto.entidade} não encontrada no sistema.`)
    }  catch(erro) { throw(`Erro no servidor`) }
};
