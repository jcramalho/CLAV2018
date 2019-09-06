const client = require('../../config/database').onthology
const normalize = require('../../controllers/api/utils').normalize

var AutosEliminacao = module.exports

AutosEliminacao.listar = async function() {
    let query = `
    select * where {
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
        SELECT ?idtermo ?termo ?desc
        WHERE {
            clav:${id} skos:hasTopConcept ?idtermo .
            OPTIONAL {
                ?idtermo skos:prefLabel ?termo .
            }
            OPTIONAL {
                ?idtermo skos:scopeNote ?desc .
            }
        }
    `
    try {
        let result = await client.query(query).execute();
        return normalize(result);
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
        await client.query(query).execute();
        var ask = `
        ASK {
            clav:${id} a skos:ConceptScheme;
                    skos:prefLabel '${label}';
                    skos:scopeNote '${desc}' .
        }`
        try {
            let result = await client.query(ask).execute();
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
        await client.query(query).execute();
        var ask = `
        ASK {
            clav:${id} a skos:ConceptScheme;
                    skos:prefLabel '${label}';
                    skos:scopeNote '${desc}' .
        }`
        try {
            let result = await client.query(ask).execute();
            return result.boolean;
        }
        catch(erro) { throw (erro);}
    } 
    catch(erro) { throw (erro);}
}

