module.exports = function(app) {

    var coretitle = "Node.js :: Test";

    app.get('/', function(req, res) {
        res.render('Pages/pugdex');
    });

    app.get('/catalogo', function(req, res) {
        res.render('Pages/Orgs/catalogo');
    });

    app.get('/organizacao', function(req, res) {
        res.render('Pages/Orgs/organizacao');
    });

    app.get('/novaorganizacao', function(req, res) {
        res.render('Pages/Orgs/novaOrg');
    });

    app.get('/legislacoes', function(req, res) {
        res.render('Pages/Legs/legislacoes');
    });

    app.get('/legislacao', function(req, res) {
        res.render('Pages/Legs/consultaLegislacao');
    });
}