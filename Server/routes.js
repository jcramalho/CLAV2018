module.exports = function(app) {

    var coretitle = "Node.js :: Test";

    app.get('/', function(req, res) {
        res.render('Pages/pugdex');
    });

    app.get('/catalogo', function(req, res) {
        res.render('Pages/catalogo');
    });

    app.get('/organizacao', function(req, res) {
        /*var url = require('url');
        
        var parts = url.parse(req.url, true);
        var args = parts.query;*/

        res.render('Pages/organizacao');
    });

    app.get('/novaorganizacao', function(req, res) {
        res.render('Pages/novaOrg');
    });
}