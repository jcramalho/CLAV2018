module.exports = function(app) {

    app.get('/', function(req, res) {
        res.render('pugdex');
    });

    app.get('/organizacoes', function(req, res) {
        res.render('Orgs/organizacoes');
    });

    app.get('/organizacao', function(req, res) {
        res.render('Orgs/consultaOrganizacao');
    });

    app.get('/novaorganizacao', function(req, res) {
        res.render('Orgs/adicionaOrganizacao');
    });

    app.get('/legislacoes', function(req, res) {
        res.render('Legs/legislacoes');
    });
    
    app.get('/legislacao', function(req, res) {
        res.render('Legs/consultaLegislacao');
    });
        
    app.get('/novalegislacao', function(req, res) {
        res.render('Legs/adicionaLegislacao');
    });

    app.get('/classes', function(req, res) {
        res.render('Classes/classes');
    });

    app.get('/classe', function(req, res) {
        res.render('Classes/consultaClasse');
    });
        
    app.get('/novaClasse', function(req, res) {
        res.render('Classes/adicionaClasse');
    });
    
    app.get('/consultaClasse', function(req, res) {
        res.render('Classes/consultaClasse');
    });

    app.get('/tabelasSelecao', function(req, res) {
        res.render('TabsSel/tabelas');
    });

    app.get('/novaTabSel', function(req, res) {
        res.render('TabsSel/adicionarTabela');
    });

    app.get('/tabelaSelecao', function(req, res) {
        res.render('TabsSel/consultarTabela');
    });

    app.get('/registar', function(req, res) {
        res.render('Users/registar');
    });
}