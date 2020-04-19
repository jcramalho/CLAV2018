const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
var Pedidos = require('../../controllers/api/pedidos');

var AutosEliminacao = module.exports

AutosEliminacao.listar = async function() {
    let query = `
    SELECT ?id ?data ?entidade ?tipo ?numero WHERE {
        ?id a clav:AutoEliminacao;
            clav:autoDataAutenticacao ?data;
            clav:temEntidadeResponsavel ?entidade;
            clav:temLegislacao ?legislacao .
        ?legislacao clav:diplomaFonte ?tipo;
                    clav:diplomaNumero ?numero
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
    select * where {
        clav:${id} a clav:AutoEliminacao;
                clav:autoNumero ?numero;
                clav:autoResponsavel ?responsavel;
                clav:autoDataAutenticacao ?data;
                clav:temEntidadeResponsavel ?entResponsavel;
                clav:temLegislacao ?legislacao ;
                clav:temFundoDe ?fundo .
        ?fundo clav:entDesignacao ?fundoNome .
        ?entResponsavel clav:entDesignacao ?entidadeNome .
        ?legislacao clav:diplomaFonte ?fonte;
                      clav:diplomaNumero ?legNumero .
    }
    `
    try {
        let response = await execQuery("query",query);
        if(normalize(response).length === 0) return null;
        var autos = normalize(response)
        
        var res = {
            id: id,
            data: autos[0].data,
            entidade: autos[0].entResponsavel.split("#")[1],
            entidadeNome: autos[0].entidadeNome,
            responsavel: autos[0].responsavel,
            tipo: autos[0].fonte,
            refLegislacao: autos[0].legislacao.split("#")[1],
            legislacao: "Portaria "+autos[0].legNumero,
            fundo: [],
            zonaControlo: []
        }
        
        for(a of autos)
            res.fundo.push({
               fundo: a.fundo.split("#")[1],
               nome: a.fundoNome,
            })
        
        var query2 = `
        select * where {
    		clav:${id} a clav:AutoEliminacao ;
                         clav:temZonaControlo ?zonaControlo .
    		?zonaControlo clav:dataInicio ?dataInicio ;
                    	  clav:dataFim ?dataFim ;
                       	  clav:temClasseControlo ?classe .
            OPTIONAL {
        			?zonaControlo clav:UIpapel ?UIpapel ;
    		} .
    		OPTIONAL {
        			?zonaControlo clav:UIDigital ?UIdigital ;
    		} .
    		OPTIONAL {
        			?zonaControlo clav:UIOutros ?UIoutros ;
    		} .
    		?classe clav:codigo ?codigo ;
              		clav:titulo ?titulo ;
                	clav:temDF ?destino;
                 	clav:temPCA ?prazo .
    		?destino clav:dfValor ?df .
    		?prazo clav:pcaValor ?pca .   
}
        `
        var response2 = await execQuery("query",query2);
        var zonasControlo = normalize(response2)
    
        for(zonaControlo of zonasControlo) {
            var res2 = {
                id: zonaControlo.zonaControlo.split("#")[1],
                dataInicio: zonaControlo.dataInicio,
                dataFim: zonaControlo.dataFim,
                UIpapel: zonaControlo.UIpapel,
                UIdigital: zonaControlo.UIdigital,
                UIoutros: zonaControlo.UIoutros,
                codigo: zonaControlo.codigo,
                titulo: zonaControlo.titulo,
                destino: zonaControlo.df,
                pca: zonaControlo.pca,
                dono: [],
                agregacoes: []
            }
            
            if(res2.destino === "C") {
                res2['ni'] = "Participante"
                var query3 = `
                select * where {
                    clav:${res2.id} clav:temDono ?dono .
                    ?dono clav:entDesignacao ?entNome .
                }
                `

                var response3 = await execQuery("query",query3);
                var donos = normalize(response3)
                
                for(dono of donos) {
                    res2.dono.push({
                        dono: dono.dono.split("#")[1],
                        nome: dono.entNome,
                    })
                }
            }
            var query4 = `
            select * where {
                clav:${res2.id} clav:temAgregacao ?ag .
                ?ag clav:agregacaoCodigo ?codigo ;
                    clav:agregacaoTitulo ?titulo ;
                    clav:agregacaoDataContagem ?data .
                OPTIONAL {    
                    ?ag clav:temNI ?ni .
                }
            }
            `
            var response4 = await execQuery("query",query4)
            var agregacoes = normalize(response4)
            
            for(ag of agregacoes) {
                res2.agregacoes.push({
                    codigo: ag.codigo,
                    titulo: ag.titulo,
                    dataContagem: ag.data,
                    ni: ag.ni.split("_")[1]
                })
            }

            res.zonaControlo.push(res2)
        }

        return res
    } 
    catch(erro) { throw (erro);}
}

AutosEliminacao.adicionar = async function (auto) {
    var currentTime = new Date();

    var tipo = auto.legislacao.split(' ')[0]
    var numero = auto.legislacao.split(' ')[1]
    var queryLeg = `
        SELECT * WHERE {
            ?leg a clav:Legislacao;
                clav:diplomaTipo "${tipo}";
                clav:diplomaNumero "${numero}" .
        }
    `
    var queryNum = `
        select * where {
            ?ae a clav:AutoEliminacao ;
                clav:temEntidadeResponsavel clav:${auto.entidade} .
        }
    `
    try {
        let resultLeg = await execQuery("query", queryLeg);
        resultLeg = normalize(resultLeg)
        let resultNum = await execQuery("query", queryNum);
        resultNum = normalize(resultNum)
        
        if(resultLeg.length > 0) {
            var id = "ae_"+(resultNum.length+1)+"_"+auto.entidade.split("_")[1]+"_"+currentTime.getFullYear()
            var numero = id.split("ae_")[1].replace(/\_/g,"/")
            var data = currentTime.getFullYear()+"-"+(currentTime.getMonth()+1)+"-"+currentTime.getDate()
            var query = `{
                    clav:${id} a clav:AutoEliminacao ;
                               clav:autoNumero "${numero}" ;
                               clav:autoResponsavel "${auto.responsavel}" ;
                               clav:autoDataAutenticacao "${data}" ;
                               clav:temEntidadeResponsavel clav:${auto.entidade} ;
                               clav:temLegislacao clav:${resultLeg[0].leg.split("#")[1]} .
            `
            
            for(fundo of auto.fundo) {
                query += `
                    clav:${id} clav:temFundoDe clav:ent_${fundo.split(" - ")[0]} .
                `
            }
            
            var indexZona = 1
            for(zona of auto.zonaControlo) {
                var idZona = "zc_"+indexZona+"_"+id.split("ae_")[1];
                query += `
                    clav:${id} clav:temZonaControlo clav:${idZona} .
                `
                query += `
                    clav:${idZona} a clav:ZonaControlo ;
                        clav:temClasseControlo clav:c${zona.codigo} ;
                        clav:dataInicio "${zona.dataInicio}" ;
                        clav:dataFim "${zona.dataFim}" .
                `
                if(zona.destino=="C") {
                    query += `
                        clav:${idZona} clav:temNI clav:vc_participante .
                    `
                    
                    for(dono of zona.dono)
                        query += `
                            clav:${idZona} clav:temDono clav:ent_${dono.split(" - ")[0]} .
                        `
                }

                if(zona.uiPapel && zona.uiPapel!="0")
                    query += `
                        clav:${idZona} clav:UIpapel "${zona.uiPapel}" .
                    `
                if(zona.uiDigital && zona.uiDigital!="0")
                    query += `
                        clav:${idZona} clav:UIDigital "${zona.uiDigital}" .
                    `
                if(zona.uiOutros && zona.uiOutros!="0")
                    query += `
                        clav:${idZona} clav:UIOutros "${zona.uiOutros}" .
                    `
                
                var indexAg = 1;
                for(agregacao of zona.agregacoes) {
                    var idAg = "ag_"+indexAg+"_"+idZona
                    query += `
                        clav:${idZona} clav:temAgregacao clav:${idAg} .
                    `

                    query += `
                        clav:${idAg} a clav:Agregacao ;
                            clav:agregacaoCodigo "${agregacao.codigo}" ;
                            clav:agregacaoTitulo "${agregacao.titulo}" ;
                            clav:agregacaoDataContagem "${agregacao.dataContagem}" .
                    `
                    if(agregacao.ni.toLowerCase() === "dono") 
                        query += `
                            clav:${idAg} clav:temNI clav:vc_dono .
                        `
                    else 
                        query += `
                            clav:${idAg} clav:temNI clav:vc_participante .
                        `
                    
                    indexAg++;
                }
                indexZona++;
            }
            query += `
            }
            `
            var inserir = "INSERT DATA "+query;
            var ask = "ASK "+ query;

            return execQuery("update", inserir).then(res =>
                execQuery("query", ask).then(result => {
                  if (result.boolean) return "Sucesso na inserção do auto de eliminação";
                  else throw "Insucesso na inserção do auto de eliminação";
                })
              );
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
AutosEliminacao.criar = async (auto, user) => {    
    auto.responsavel = user.name
    auto.entidade = user.entidade
    var pedido = {
        tipoPedido: "Criação",
        tipoObjeto: "Auto de Eliminação",
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
