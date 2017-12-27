const client = require('../../../config/database').onthology;

var SelTabs = module.exports

SelTabs.list = function () {
    return client.query(
        `SELECT * WHERE { 
            ?id rdf:type clav:TabelaSelecao ;
                clav:designacao ?Name .
        }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.stats = function (id) {
    return client.query(
        `SELECT * WHERE { 
                clav:${id} rdf:type clav:TabelaSelecao ;
                    clav:designacao ?Name .
            }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.createTab = function (id, dataObj) {
    var createQuery = `
            INSERT DATA {
                clav:${id} rdf:type owl:NamedIndividual ,
                        clav:TabelaSelecao ;
                    clav:designacao '${dataObj.nome}' .
        `;

    if (classes && classes.length) {
        for (let clas in dataObj.classes) {
            createQuery += `clav:${clas} clav:pertenceTS clav:${id} .\n`;
        }
    }

    createQuery += "}"


    return client.query(createQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in create:\n" + error));
}
