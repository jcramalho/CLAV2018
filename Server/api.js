module.exports = function (app) {

    //using sparql-client-2
    app.get('/orgs', function (req, res) {
        const {SparqlClient, SPARQL} = require('sparql-client-2');
        
        const client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
            });
        
        function fetchOrgs() {
            return client.query(
                `SELECT ?id ?Nome ?Sigla where {
                    ?id rdf:type clav:Organizacao ;
                        clav:orgNome ?Nome ;
                        clav:orgSigla ?Sigla
                }`
            )
            .execute()
            //getting the content we want
            .then(response => Promise.resolve(response.results.bindings))
            .catch( function(error) {
                console.error(error);
            });
        }

        fetchOrgs().then(orgs => res.send(orgs))
        .catch( function(error) {
            console.error(error);
        });
    })

    app.get('/singleOrg', function (req, res) {
        const {SparqlClient, SPARQL} = require('sparql-client-2');
        var url = require('url');
        
        const client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
            });
        
        function fetchOrg(id) {
            return client.query(
                SPARQL`SELECT ?Nome ?Sigla where {
                    ${{clav: id}} clav:orgNome ?Nome ;
                        clav:orgSigla ?Sigla
                }`
            )
            .execute()
            //getting the content we want
            .then(response => Promise.resolve(response.results.bindings))
            .catch( function(error) {
                console.error(error);
            });
        }

        var parts = url.parse(req.url, true);
        var id = parts.query.id;

        //Answer the request
        fetchOrg(id).then(org => res.send(org))
        .catch( function(error) {
            console.error(error);
        });
    })

    app.get('/createOrg', function (req, res) {
        const {SparqlClient, SPARQL} = require('sparql-client-2');
        var url = require('url');
        
        const client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV', {
                updateEndpoint: 'http://localhost:8080/repositories/M51-CLAV/statements'
            })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
        });
        
        //Check if organization Name or Initials already exist
        function checkOrg(name, initials) {
            var checkQuery = `
                SELECT (count(*) as ?Count) where { 
                    ?o rdf:type clav:Organizacao ;
                        clav:orgSigla ?s ;
                        clav:orgNome ?n .
                    filter (?s='${initials}' || ?n='${name}').
                }
            `;
            
            return client.query(checkQuery).execute()
            //Getting the content we want
            .then(response => Promise.resolve(response.results.bindings[0].Count.value))
            .catch( function(error) {
                console.error("Error in check:\n"+error);
            });
        }

        //Create new organization
        function createOrg(id, name, initials) {
            var createQuery = SPARQL`
                INSERT DATA {
                    ${{clav: id}} rdf:type clav:Organizacao ;
                        clav:orgNome ${name} ;
                        clav:orgSigla ${initials}
                }
            `;

            return client.query(createQuery).execute()
            .then( response => Promise.resolve(response))
            .catch( error => console.error("Error in create:\n"+error));
        }

        //Parsing url to get parameters
        var parts = url.parse(req.url, true);
        var initials = parts.query.initials;
        var name = parts.query.name;
        var id = "org_"+initials;

        //Executing queries
        checkOrg(name, initials)
        .then( function(count) {
            if (count>0) {
                res.send("Nome e/ou Sigla já existente(s)!");
            }
            else {
                createOrg(id,name,initials)
                .then( function() {
                    res.send("Inserido!");
                })
                .catch( error => console.error(error));
            }
        })
        .catch( error => console.error("General error:\n"+error));
    })

    /* //using sparql-client
    app.get('/orgs', function (req, res) {
        var SparqlClient = require('sparql-client');
        var util = require('util');

        var client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV');
          
        var query = "\
            PREFIX : <http://jcr.di.uminho.pt/m51-clav#>\
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
            select ?id ?Nome ?Sigla where { \
                ?id rdf:type :Organizacao .\
                ?id :orgNome ?Nome .\
                ?id :orgSigla ?Sigla\
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
    
    app.get('/singleOrg', function (req, res) {
        var SparqlClient = require('sparql-client');
        var util = require('util');
        var url = require('url');

        var parts = url.parse(req.url, true);
        var id = parts.query.id;

        var client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV');
          
        var query = "\
            PREFIX : <http://jcr.di.uminho.pt/m51-clav#>\
            select ?Nome ?Sigla where { \
                :"+id+" :orgNome ?Nome .\
                :"+id+" :orgSigla ?Sigla\
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
    */

    app.get('/createOrg', function (req, res) {
        var SparqlClient = require('sparql-client');
        var util = require('util');
        var url = require('url');

        var parts = url.parse(req.url, true);

        var name= parts.query.name;
        var initials= parts.query.initials;
        var id = "org_"+initials;

        var client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV');
          
        //Check if name or initials already exist
        var query = "\
            PREFIX : <http://jcr.di.uminho.pt/m51-clav#>\
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
            select (count(*) as ?Count) where { \
                ?s rdf:type :Organizacao .\
                ?s :orgSigla ?p .\
                ?s :orgNome ?n .\
                filter (?p='"+initials+"' || ?n='"+name+"').\
            }\
        ";

        client.query(query).execute(function(error, results) {
            if(results){                
                //parse response
                var n= results.results.bindings[0].Count.value;

                if(n>0){
                    res.send("Nome ou Sigla já existentes!");
                }
                else{
                    console.log("ola");
                    var createQuery = "\
                        PREFIX : <http://jcr.di.uminho.pt/m51-clav#>\n\
                        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\
                        INSERT DATA { \n\
                        :"+id+" rdf:type :Organizacao .\n\
                        :"+id+" :orgNome '"+name+"' .\n\
                        :"+id+" :orgSigla '"+initials+"'\n\
                        }\n\
                        WHERE { ?s ?p ?o }\
                    ";

                    client.query(createQuery).execute(function(err, res) {
                        if(res){
                            console.log(res.results);
                        }
                        else {
                            res.send("Error!");
                        }
                    });
                }
            } 
            else {
                res.send("Error!");
            }
        });
    });
}