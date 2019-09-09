const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
const projection = require('../../controllers/api/utils').projection;

var AutosEliminacao = module.exports

AutosEliminacao.listar = async function() {
    let query = `
    select ?id ?data ?entidade ?fundo ?tipo ?num where {
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
        let result = await execQuery("query", query);
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

// Devolve a lista de termos de um VC: idtermo, termo
AutosEliminacao.consultar = async function(id) {
    var query = `
    select * where {
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
        return execQuery("query", query)
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

//Update de VC
AutosEliminacao.update = async function (id, label, desc) {
    var query = `
        DELETE {    
            clav:${id} a skos:ConceptScheme;
                skos:prefLabel ?label;
                skos:scopeNote ?desc .
        
        } INSERT {
            clav:${id} a skos:ConceptScheme;
                skos:prefLabel "${label}";
                skos:scopeNote "${desc}" .
        } WHERE {
            clav:${id} a skos:ConceptScheme;
                skos:prefLabel ?label;
                skos:scopeNote ?desc .
        }
    `
    try {
        await execQuery("update", query);
        var ask = `
        ASK {
            clav:${id} a skos:ConceptScheme;
                    skos:prefLabel '${label}';
                    skos:scopeNote '${desc}' .
        }`
        try {
            let result = await execQuery("query", ask);
            return result.boolean;
        }
        catch(erro) { throw (erro);}
    } 
    catch(erro) { throw (erro);}
}

AutosEliminacao.adicionar = async function (id, label, desc) {
    var query = `
        INSERT DATA {
            clav:${id} a skos:ConceptScheme;
                    skos:prefLabel '${label}';
                    skos:scopeNote '${desc}' .
        }
    `
    try {
        await execQuery("update", query);
        var ask = `
        ASK {
            clav:${id} a skos:ConceptScheme;
                    skos:prefLabel '${label}';
                    skos:scopeNote '${desc}' .
        }`
        try {
            let result = await execQuery("ask", query);
            return result.boolean;
        }
        catch(erro) { throw (erro);}
    } 
    catch(erro) { throw (erro);}
}

