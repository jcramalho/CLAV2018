module.exports = function (app) {

    app.get('/orgs', function (req, res) {
        var SparqlClient = require('sparql-client');
        var util = require('util');

        var client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV');
          
        var query = "\
            PREFIX : <http://jcr.di.uminho.pt/m51-clav#>\
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
            select ?Nome ?Sigla where { \
                ?s rdf:type :Organizacao .\
                ?s :orgNome ?Nome .\
                ?s :orgSigla ?Sigla\
            }\
        ";

        client.query(query).execute(function(error, results) {
            if(results){                
                ///retirar JSON que interessa
                resultados = JSON.stringify(results.results.bindings);

                res.send(resultados);
            } 
            else {
                res.send("Error!");
            }
        });
    });
}