const client = require('../../config/database').onthology
const normalize = require('../../controllers/api/utils').normalize
const projection = require('../../controllers/api/utils').projection;

var AutosEliminacao = module.exports

AutosEliminacao.listar = async function() {
    let query = `
    SELECT ?id ?data ?entidade ?fundo ?tipo ?num WHERE {
        ?id a clav:AutoEliminacao;
                clav:autoDataAutenticacao ?data;
                clav:temEntidadeResponsavel ?entidade ;
                clav:temLegislacao ?legislacao ;
                clav:fundo ?fundo .
        ?legislacao clav:diplomaTipo ?tipo ;
                    clav:diplomaNumero ?num .
    } 
    `
    try {
        let result = await client.query(query).execute();
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

// Devolve a lista de termos de um VC: idtermo, termo
AutosEliminacao.consultar = async function(id) {
    var query = `
    SELECT * WHERE {
        clav:ae_DGLAB_2019 a clav:AutoEliminacao;
                clav:autoDataAutenticacao ?data;
                clav:autoResponsavel ?resp ;
                clav:temEntidadeResponsavel ?entidade ;
                clav:temLegislacao ?legislacao ;
                clav:fundo ?fundo ;
                   clav:temZonaControlo ?zc .
        ?legislacao clav:diplomaTipo ?tipo ;
                clav:diplomaNumero ?num .
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
        return client.query(query)
            .execute()
            .then(response => {
                if(normalize(response).length === 0) return []
                var autos = normalize(response)
                var res = {
                    id: id,
                    data: autos[0].data,
                    entidade: autos[0].entidade,
                    responsavel: autos[0].resp,
                    legislacaoID: autos[0].legislacao,
                    legislacao: autos[0].tipo + ' ' + autos[0].num,
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
        let resultLeg = client.query(queryLeg).execute();
        let resultEnt = normalize(client.query(queryEnt).execute());
        if(resultLeg.boolean && (resultEnt.length > 0)) {
            var id = ":ae_"+nanoid();
            var data = currentTime.getDate()+"/"+(currentTime.getMonth()+1)+"/"+currentTime.getFullYear()
            var query = `
                INSERT DATA {
                    clav:${id} a clav:AutoEliminacao ;
                               clav:autoNumero "${id}" ;
                               clav:autoDataAutenticacao "${data}" ;
                               clav:autoResponsavel "${auto.responsavel}" ;
                               clav:autoLegislacao "${auto.legislacao}" ;
                               clav:temEntidadeResponsavel :${resultEnt.split("#")[1]} .
            `
            for(zona of auto.zonaControlo) {
                var idZona = ":zc_"+nanoid();
                query += `
                    clav:${id} clav:temZonaControlo clav:${idZona} .
                `
                query += `
                    clav:${idZona} a clav:ZonaControlo ;`
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
            return client.query(query)
                    .execute()
                    .then(response => normalize(response));
        }
    } 
    catch(erro) { throw (erro);}
}

