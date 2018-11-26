const client = require('../../config/database').onthology
const normalize = require('../../controllers/api/utils').normalize

var Vocabulario = module.exports

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
        let result = await client.query(query).execute();
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
        let result = await client.query(query).execute();
        return normalize(result);
    } 
    catch(erro) { throw (erro);}
}