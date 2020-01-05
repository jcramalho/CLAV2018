//Basic webserver
var express = require('express'),
    app = express();

var cors = require('cors')
app.use(cors())

// Logging na consola do admin
var logger = require('morgan')

//Funcao auxiliar para contar numero de GET e POST
var apiStats = require('./models/api')
var Calls = require('./controllers/api/logs')

function getRoute(req){
    const route = req.route ? req.route.path : '' // check if the handler exist
    const baseUrl = req.baseUrl ? req.baseUrl : '' // adding the base url if the handler is a child of another handler
 
    // return route ? `${baseUrl === '/' ? '' : baseUrl}${route}` : 'unknown route'
    return route ? `${baseUrl === '/' ? '' : baseUrl}` : 'unknown route'
}

app.use((req, res, next) => {
    res.on('finish', async () => {
        //console.log('_DEBUG_:' + `${req.method} ${getRoute(req)} ${res.statusCode}`) 
        if(getRoute(req).includes('/api/')){
            apiStats.addUsage(req.method, getRoute(req));
        }

        if(res.locals.id && res.locals.idType){
            Calls.newCall(Calls.getRoute(req), req.method, res.locals.id, res.locals.idType, res.statusCode)
        }
    });
    next();
});

//body parser for post requests
var bodyParser = require('body-parser')
app.use(bodyParser.json({limit: '50mb'}));         // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({
    limit : '50mb',
    // to support URL-encoded bodies
    extended: true,
    parameterLimit:50000
}));

//authentication dependencies
var passport = require('passport');

//MongoDB session setup
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var dataBases = require('./config/database');
var mongoose = require('mongoose');

require('./config/passport')(passport);

//config
app.use(express.static(__dirname + '/public'));

// MongoDB Express Session
app.use(session({
    secret: 'DBK8R6L3Y0QQS3KKVI0QG5W0',
    saveUninitialized: true,
    resave: true,
    autoRemove: 'interval',
    autoRemoveInterval: 15, //minutes
    store: new MongoStore({
      url: dataBases.userDB,
      ttl: 1800 //seconds
    })
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
app.use(logger('dev'))

// Connect mongo and mongoose
mongoose.Promise = global.Promise;
mongoose.connect(dataBases.userDB, {useMongoClient: true, poolSize: 100 /*max number of connections (default is 5)*/})
    .then(()=> console.log('Mongo ready: ' + mongoose.connection.readyState))
    .catch(()=> console.log('Mongo: erro na conexão...'))

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo erro na conexão: '));

//loads APP State
var State = require('./controllers/state.js')
State.reset()

//loads APP travessia
var travessia = require('./controllers/travessia.js')
travessia.reset()

//Swagger
var fs = require('fs')
const swaggerUi = require('swagger-ui-express');
var yaml = require('js-yaml')
var yamlinc = require('yaml-include')
var src = fs.readFileSync("./swagger/index.yaml")

process.chdir(__dirname + '/swagger');
var swaggerDoc = yaml.load(src, { schema: yamlinc.YAML_INCLUDE_SCHEMA });
process.chdir(__dirname);

swaggerDoc.servers[0].url = dataBases.swaggerURL + '/api'
fs.writeFileSync("./public/clav.yaml", yaml.dump(swaggerDoc))

var options = {
  explorer: true,
  customSiteTitle: 'CLAV API',
  swaggerOptions: {
    url: dataBases.swaggerURL + '/clav.yaml',
    tagsSorter: 'alpha',
    operationsSorter: (a, b) => {
        var methods = ["get", "post", "put", "delete", "patch", "options", "trace"]
        var result = methods.indexOf(a.get("method")) - methods.indexOf(b.get("method"))

        if(result == 0){
            var a_path = a.get("path")
            var b_path = b.get("path")

            result = a_path.length - b_path.length

            if(result == 0){
                result = a_path.localeCompare(b_path)
            }
        }

        return result
    }
  }
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, options));

//formatar o resultado consoante a querystring fs
const { outputFormat } = require('./routes/outputFormat.js')

//routes and API
app.use('/api/entidades',require('./routes/api/entidades'), outputFormat);
app.use('/api/tipologias',require('./routes/api/tipologias'), outputFormat);
app.use('/api/legislacao',require('./routes/api/leg'), outputFormat);
app.use('/api/classes',require('./routes/api/classes'), outputFormat);
app.use('/api/notasAp',require('./routes/api/notasAp'));
app.use('/api/exemplosNotasAp',require('./routes/api/exemplosNotasAp'));
app.use('/api/indicePesquisa',require('./routes/api/indicePesquisa'));
app.use('/api/tabelasSelecao',require('./routes/api/tabsSel'));
app.use('/api/termosIndice',require('./routes/api/termosIndice'));
app.use('/api/vocabularios',require('./routes/api/vocabularios'));
app.use('/api/autosEliminacao',require('./routes/api/autosEliminacao'));
app.use('/api/pedidos',require('./routes/api/pedidos'));
app.use('/api/pendentes',require('./routes/api/pendentes'));
app.use('/api/users',require('./routes/api/users'));
app.use('/api/chaves',require('./routes/api/chaves'));
app.use('/api/stats', require('./routes/api/stats'));
app.use('/api/travessia',require('./routes/api/travessia'));
app.use('/api/invariantes',require('./routes/api/invariantes'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/ontologia', require('./routes/api/ontologia'));
app.use('/api/reload', require('./routes/api/reload'));
app.use('/api/logs', require('./routes/api/logs'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500).send(`Erro: ${err.message}`);
});

module.exports = app; 
