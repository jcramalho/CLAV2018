//Basic webserver
var express = require('express'),
    app = express();

require('./Server/routes')(app);
require('./Server/apiOrgs')(app);
require('./Server/apiLegs')(app);

module.exports = app;

//config
app.set('view engine', 'pug');
app.set('views', __dirname);

//standard
app.use(express.static(__dirname + '/Client'));
app.use("/styles", express.static(__dirname + '/Styles'));

//Starts and listens
var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Listening on " + port + " | In folder " + __dirname + '\\public');
});