module.exports = function (app) {
    
    app.get('/classesn', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');
        
        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                noInferences: 'http://www.ontotext.com/explicit'
            }
        );

        function fetchClasses(level) {
            if(!level){
                level=1;
            }
            
            var listQuery=`
                SELECT ?id ?Code ?Title (count(?sub) as ?NChilds) FROM noInferences:
                WHERE {
                    ?id rdf:type clav:Classe_N`+level+` ;
                        clav:codigo ?Code ;
                        clav:titulo ?Title .
                    optional {?sub clav:temPai ?id}
                }Group by ?id ?Code ?Title
            `;

            return client.query(listQuery).execute()
                .then(response => Promise.resolve(response.results.bindings))
                .catch(function (error) {
                    console.error(error);
                }
            );
        }

        var parts = url.parse(req.url, true);
        var level = parts.query.level;

        fetchClasses(level)
            .then(list => res.send(list))
            .catch(function (error) {
                console.error(error);
            }
        );
    })

        
    app.get('/childClasses', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                noInferences: 'http://www.ontotext.com/explicit'
            });

        function fetchChilds(parent) {
            var fetchQuery =SPARQL`
                SELECT ?Child ?Code ?Title (count(?sub) as ?NChilds)
                WHERE {
                    ?Child clav:temPai clav:`+parent+` ;
                           clav:codigo ?Code ;
                           clav:titulo ?Title
                    optional {?sub clav:temPai ?Child}
                }Group by ?Child ?Code ?Title
            `;
            
            console.log("query: \n"+fetchQuery);

            return client.query(fetchQuery)
                .execute()
                //getting the content we want
                .then(response => Promise.resolve(response.results.bindings))
                .catch(function (error) {
                    console.error(error);
                });
        }

        var parts = url.parse(req.url, true);
        var parent = parts.query.parent;

        console.log(parent);

        //Answer the request
        fetchChilds(parent).then(list => res.send(list))
            .catch(function (error) {
                console.error(error);
            });
    })

    
    app.post('/createAppNotes', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        
        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV', {
                updateEndpoint: 'http://localhost:7200/repositories/M51-CLAV/statements'
            })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                owl: 'http://www.w3.org/2002/07/owl#',
        });


        //Create new organization
        function createAppNotes(list) {            
            var createQuery = "INSERT DATA {";

            for(var i=0;i<list.length;i++){
                createQuery+=`
                    clav:`+list[i].id+` rdf:type owl:NamedIndividual,
                            clav:NotaAplicacao;
                        clav:conteudo \"`+list[i].text+`\" .
                `
            }
            createQuery+='}';

            return client.query(createQuery).execute()
                .then(response => Promise.resolve(response))
                .catch(error => console.error("Error in create:\n" + error));
        }

        //Getting data
        var list= req.body.list;

        createAppNotes(list)
        .then(function () {
            res.send("Nota(s) de Aplicação Criadas!");
        })
        .catch(error => console.error(error));     
    })

    
    app.post('/createDelNotes', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        
        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV', {
                updateEndpoint: 'http://localhost:7200/repositories/M51-CLAV/statements'
            })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                owl: 'http://www.w3.org/2002/07/owl#',
        });


        //Create new organization
        function createDelNotes(list) {            
            var createQuery = "INSERT DATA {";

            for(var i=0;i<list.length;i++){
                createQuery+=`
                    clav:`+list[i].id+` rdf:type owl:NamedIndividual,
                            clav:NotaExclusao;
                        clav:conteudo \"`+list[i].text+`\" .
                `
            }
            createQuery+='}';

            return client.query(createQuery).execute()
                .then(response => Promise.resolve(response))
                .catch(error => console.error("Error in create:\n" + error));
        }

        //Getting data
        var list= req.body.list;

        createDelNotes(list)
        .then(function () {
            res.send("Nota(s) de Exclusão Criadas!");
        })
        .catch(error => console.error(error));     
    })
}