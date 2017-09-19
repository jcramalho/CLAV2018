module.exports = function(app) {

    var coretitle = "Node.js :: Test";

    app.get('/', function(req, res) {
        res.render('Pages/pugdex');
    });

    app.get('/catalogo', function(req, res) {
        res.render('Pages/catalogo');
    });
}