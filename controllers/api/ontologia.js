const client = require('../../config/database').onthology
const Ontologia = module.exports

Ontologia.data = async () => {
    const query = `PREFIX dc: <http://purl.org/dc/elements/1.1#>
        select ?d where {
            <http://jcr.di.uminho.pt/m51-clav> dc:date ?d .
        }`

    try{
        var res = await client.query(query).execute()
        return res.results.bindings[0].d.value 
    }catch(erro) {
        throw (erro) 
    }
}

Ontologia.descricao = async () => {
    const query = `select ?d where {
            <http://jcr.di.uminho.pt/m51-clav> rdfs:comment ?d .
        }`

    try{
        var res = await client.query(query).execute()
        return res.results.bindings[0].d.value 
    }catch(erro) {
        throw (erro) 
    }
}
