module.exports = function (app) {
    
        //using sparql-client-2
        app.get('/classesN1', function (req, res) {
            const { SparqlClient, SPARQL } = require('sparql-client-2');
    
            const client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV')
                .register({
                    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                    clav: 'http://jcr.di.uminho.pt/m51-clav#',
                    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                    noInferences: 'http://www.ontotext.com/explicit'
                }
            );
    
            function fetchClasses() {
                var listQuery=`
                    SELECT ?N1 (count(?sub) as ?NChilds) FROM noInferences:
                    WHERE {
                        ?N1 rdf:type clav:Classe_N1 .
                        optional {?sub clav:temPai ?N1}
                    }Group by(?N1)
                `;

                return client.query(listQuery).execute()
                    .then(response => Promise.resolve(response.results.bindings))
                    .catch(function (error) {
                        console.error(error);
                    }
                );
            }
    
            fetchClasses()
                .then(list => res.send(list))
                .catch(function (error) {
                    console.error(error);
                }
            );
        })

        
    app.get('/childClasses', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:8080/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                noInferences: 'http://www.ontotext.com/explicit'
            });

        function fetchChilds(parent) {
            var fetchQuery =SPARQL`
                SELECT ?Child (count(?sub) as ?NChilds) FROM noInferences:
                WHERE {
                    ?Child clav:temPai ${{clav: parent}} .
                    optional {?sub clav:temPai ?Child}
                }Group by(?Child)
            `;
            
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

        //Answer the request
        fetchChilds(parent).then(list => res.send(list))
            .catch(function (error) {
                console.error(error);
            });
    })
    }