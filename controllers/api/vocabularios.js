const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize

var Vocabulario = module.exports

Vocabulario.listar = async function() {
    let query = `
    SELECT ?id ?label ?desc
    WHERE {
        ?id a skos:ConceptScheme.
        OPTIONAL {
            ?id skos:prefLabel ?label.
        } 
        OPTIONAL {
            ?id skos:scopeNote ?desc.
        }
        MINUS {
            clav:vc_removidos a skos:ConceptScheme ;
                              skos:prefLabel ?label ;
                              skos:scopeNote ?desc .
        }      
    } 
    `
    try {
        let result = await execQuery("query", query);
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

// Devolve a lista de termos de um VC: idtermo, termo
Vocabulario.consultar = async function(id) {
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
        let result = await execQuery("query", query);
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

// Devolve as formas de contagem do PCA, na forma: 
/*
[
    {
        "id": "conclusaoProcedimento",
        "label": "Data de conclusão do procedimento"
    },
    ...
]
*/
Vocabulario.formasContagemPCA = async function () {
    var query = `
        SELECT DISTINCT ?id ?label WHERE { 
            ?pca clav:pcaFormaContagemNormalizada ?fid .    
            ?fid skos:prefLabel ?label .
            BIND (STRAFTER(STR(?fid), "#vc_pcaFormaContagem_") AS ?id)
        }`

    try {
        let result = await execQuery("query", query);
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

// Devolve as subformas de contagem do PCA, na forma: 
/*
[
    {
        "id": "SubformaContagem_1",
        "label": "Data do último assento, respeitando 30 anos para o óbito, 50 anos para o casamento e 100 anos para o nascimento, nos termos do artigo 15.º da Lei n.º 324/2007"
    },
    ...
]
*/
Vocabulario.subFormasContagemPCA = async function () {
    var query = `
        SELECT DISTINCT ?id ?label WHERE { 
            ?pca clav:pcaSubformaContagem ?subid .    
            ?subid skos:scopeNote ?label .
            BIND (STRAFTER(STR(?subid), "#vc_pca") AS ?id)
        }`
    try {
        let result = await execQuery("query", query);
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}

//Update de VC
Vocabulario.update = async function (id, label, desc) {
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

Vocabulario.adicionar = async function (id, label, desc) {
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
            let result = await execQuery("query", ask);
            return result.boolean;
        }
        catch(erro) { throw (erro);}
    } 
    catch(erro) { throw (erro);}
}

Vocabulario.adicionarTermo = async function (idVC, id, termo, desc) {
    var query = `
        INSERT DATA {
            clav:${id} a skos:Concept ;
        						skos:prefLabel "${termo}" ;
        						skos:scopeNote "${desc}" .
            clav:${idVC} skos:hasTopConcept clav:${id} .
        }
    `
    try {
        await execQuery("update", query);
        var ask = `
        ASK {
            clav:${id} a skos:Concept ;
        						skos:prefLabel "${termo}" ;
        						skos:scopeNote "${desc}" .
            clav:${idVC} skos:hasTopConcept clav:${id} .
        }`
        try {
            let result = await execQuery("query", ask);
            return result.boolean;
        }
        catch(erro) { throw (erro);}
    } 
    catch(erro) { throw (erro);}
}

Vocabulario.deleteTermo = async function (id) {
    var query = `
        DELETE {
            ?vc skos:hasTopConcept clav:${id} .
        } INSERT {
            clav:vc_removidos skos:hasTopConcept clav:${id} .
        } WHERE {
            ?vc skos:hasTopConcept clav:${id} .
        }
    `
    try {
        await execQuery("update", query);
        var ask = `
        ASK {
            clav:vc_removidos skos:hasTopConcept clav:${id} .
        }`
        try {
            let result = await execQuery("query", ask);
            return result.boolean;
        }
        catch(erro) { throw (erro);}
    } 
    catch(erro) { throw (erro);}
}
