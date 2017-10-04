module.exports = function (app) {

    //using sparql-client-2
    app.get('/legs', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
            });

        function fetchLegs() {
            return client.query(
                `SELECT * WHERE { 
                    ?id rdf:type clav:Legislacao;
                        clav:diplomaAno ?Ano;
                        clav:diplomaData ?Data;
                        clav:diplomaNumero ?Número;
                        clav:diplomaTipo ?Tipo;
                        clav:diplomaTitulo ?Titulo
                }`
            )
                .execute()
                //getting the content we want
                .then(response => Promise.resolve(response.results.bindings))
                .catch(function (error) {
                    console.error(error);
                });
        }

        fetchLegs()
            .then(legs => res.send(legs))
            .catch(function (error) {
                console.error(error);
            });
    })

    app.get('/singleLeg', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
            });

        function fetchLeg(id) {
            var fetchQuery =SPARQL`
                SELECT * WHERE { 
                    ${{clav: id}} clav:diplomaAno ?Ano;
                        clav:diplomaData ?Data;
                        clav:diplomaNumero ?Número;
                        clav:diplomaTipo ?Tipo;
                        clav:diplomaTitulo ?Titulo;
                        clav:diplomaLink ?Link;
                }`;
            
            return client.query(fetchQuery)
                .execute()
                //getting the content we want
                .then(response => Promise.resolve(response.results.bindings))
                .catch(function (error) {
                    console.error(error);
                });
        }

        var parts = url.parse(req.url, true);
        var id = parts.query.id;

        //Answer the request
        fetchLeg(id).then(leg => res.send(leg))
            .catch(function (error) {
                console.error(error);
            });
    })

    app.get('/createLeg', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV', {
                updateEndpoint: 'http://localhost:7200/repositories/M51-CLAV/statements'
            })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                owl: 'http://www.w3.org/2002/07/owl#',
        });

        //Check if legislation number already exists
        function checkNumber(number) {
            var checkQuery = `
                SELECT (count(*) AS ?Count) WHERE {
                    ?leg rdf:type clav:Legislacao ;
                        clav:diplomaNumero '${number}'
                }
            `;

            return client.query(checkQuery).execute()
                //Getting the content we want
                .then(response => Promise.resolve(response.results.bindings[0].Count.value))
                .catch(function (error) {
                    console.error("Error in check:\n" + error);
                });
        }

        //TODO find better solution
        //Generates new ID number
        function newID(){
            var countQuery = SPARQL`
                SELECT (count(*) AS ?Count)
                WHERE {
                    ?s rdf:type clav:Legislacao .
                }
            `;

            return client.query(countQuery).execute()
            //Getting the content we want
            .then(response => Promise.resolve(response.results.bindings[0].Count.value))
            .catch(function (error) {
                console.error("Error in check:\n" + error);
            });
        }

        //Create new organization
        function createLeg(newID, year, date, number, type, title, link) {            
            var createQuery = SPARQL`
                INSERT DATA {
                    ${{ clav: newID }} rdf:type owl:NamedIndividual ,
                            clav:Legislacao ;
                        clav:diplomaAno ${year} ;
                        clav:diplomaData ${date} ;
                        clav:diplomaNumero ${number} ;
                        clav:diplomaTipo ${type} ;
                        clav:diplomaTitulo ${title} ;
                        clav:diplomaLink ${link} ;
                }
            `;

            return client.query(createQuery).execute()
                .then(response => Promise.resolve(response))
                .catch(error => console.error("Error in create:\n" + error));
        }

        //Parsing url to get parameters
        var parts = url.parse(req.url, true);
        var year = parts.query.year;
        var date = parts.query.date;
        var number = parts.query.number;
        var type = parts.query.type;
        var title = parts.query.title;
        var link = parts.query.link;

        
        //Executing queries
        checkNumber(number)
            .then(function (count) {
                if (count > 0) {
                    res.send("Número já existente!");
                }
                else {

                    newID()
                        .then(function(ids){
                            var newID = "leg_"+(parseInt(ids)+1);
                            
                            createLeg(newID, year, date, number, type, title, link)
                                .then(function () {
                                    res.send("Inserido!");
                                })
                                .catch(error => console.error(error));
                        })
                        .catch(error => console.error("newID error: \n\t"+error))
                }
            })
            .catch(error => console.error("General error:\n" + error));
    })
    
    app.get('/updateleg', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV', {
            updateEndpoint: 'http://localhost:7200/repositories/M51-CLAV/statements'
        })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
            });

        //Check if legislation Initials already exists
        function checkNumber(number) {
            var checkQuery = `
                SELECT (count(*) AS ?Count) WHERE {
                    ?org rdf:type clav:Legislacao ;
                        clav:diplomaNumero '${number}'
                }
            `;
            return client.query(checkQuery).execute()
                //Getting the content we want
                .then(response => Promise.resolve(response.results.bindings[0].Count.value))
                .catch(function (error) {
                    console.error("Error in check:\n" + error);
                });
        }

        //Update organization
        function updateLeg(id, year, date, number, type, title, link) {
            var del= "";
            var ins= "";
            var wer= "";
            
            if (year) {
                del+= SPARQL`${{clav: id}} clav:diplomaAno ?y .\n`;
                ins+= SPARQL`${{clav: id}} clav:diplomaAno ${year} .\n`;
            }
            if (date) {
                del+= SPARQL`${{clav: id}} clav:diplomaData ?d .\n`;
                ins+= SPARQL`${{clav: id}} clav:diplomaData ${date} .\n`;
            }
            if (number) {
                del+= SPARQL`${{clav: id}} clav:diplomaNumero ?n .\n`;
                ins+= SPARQL`${{clav: id}} clav:diplomaNumero ${number} .\n`;
            }
            if (type) {
                del+= SPARQL`${{clav: id}} clav:diplomaTipo ?t .\n`;
                ins+= SPARQL`${{clav: id}} clav:diplomaTipo ${type} .\n`;
            }
            if (title) {
                del+= SPARQL`${{clav: id}} clav:diplomaTitulo ?tit .\n`;
                ins+= SPARQL`${{clav: id}} clav:diplomaTitulo ${title} .\n`;
            }
            if (link) {
                del+= SPARQL`${{clav: id}} clav:diplomaLink ?l .\n`;
                ins+= SPARQL`${{clav: id}} clav:diplomaLink ${link} .\n`;
            }

            wer= "WHERE {"+del+"}\n";
            del= "DELETE {"+del+"}\n";
            ins= "INSERT {"+ins+"}\n";

            var updateQuery = del + ins + wer;

            return client.query(updateQuery).execute()
                .then(response => Promise.resolve(response))
                .catch(error => console.error("Error in update:\n" + error));
        }

        //Parsing url to get parameters
        var parts = url.parse(req.url, true);
        var id = parts.query.id;
        var year = parts.query.year;
        var date = parts.query.date;
        var number = parts.query.number;
        var type = parts.query.type;
        var title = parts.query.title;
        var link = parts.query.link;

        //Executing queries
        if (number) {
            checkNumber(number)
                .then(function (count) {
                    if (count > 0) {
                        res.send("Número já existente!");
                    }
                    else {
                        updateLeg(id, year, date, number, type, title, link)
                            .then(function () {
                                res.send("Actualizado!");
                            })
                            .catch(error => console.error(error));
                    }
                })
                .catch(error => console.error("Check error:\n" + error));
        }
        else {
            updateLeg(id, year, date, number, type, title, link)
                .then(function () {
                    res.send("Actualizado!");
                })
                .catch(error => console.error(error));
        }
    })

    app.get('/deleteLeg', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV', {
                updateEndpoint: 'http://localhost:7200/repositories/M51-CLAV/statements'
            })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
        });

        function deleteLeg(id) {
            return client.query(SPARQL`
                    DELETE {
                        ${{ clav: id }} ?o ?p
                    }
                    WHERE { ?s ?o ?p }
                `).execute()
                //getting the content we want
                .then(response => Promise.resolve(response))
                .catch(function (error) {
                    console.error(error);
                });
        }

        var parts = url.parse(req.url, true);
        var id = parts.query.id;

        //Answer the request
        deleteLeg(id)
            .then(function() {
                res.send("Entrada apagada!");
            })
            .catch(function (error) {
                console.error(error);
        });
    })
}