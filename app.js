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
require('./config/passport')(passport);

//config
app.use(express.static(__dirname + '/public'));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
app.use(logger('dev'))

// Connect mongo and mongoose
var dataBases = require('./config/database');
var mongoose = require('mongoose');
var ontologia = require('./controllers/api/ontologia');
mongoose.Promise = global.Promise;

//Como o emit não funciona (devolve false) caso não haja já um listener
//voltasse a tentar de 1 em 1 segundo por forma a avisar que o servidor
//já pode escutar visto que já está pronto
function emit(){
    if(!app.emit('ready')){
        setTimeout(emit(), 1000)
    }
}

mongoose.connect(dataBases.userDB, {
    useMongoClient: true,
    poolSize: 100 //max number of connections (default is 5)
})
    .then(async () => {
        var Mstate = mongoose.connection.readyState

        if(Mstate == 1){
            mongoose.connection.on('error', console.error.bind(console, 'MongoDB: erro na conexão: '));

            console.log('MongoDB: pronto. Status: ' + Mstate)
            try{
                var data = await ontologia.data()
                console.log('GraphDB: pronto. Data da ontologia: ' + data)
            }catch(e){
                console.error("GraphDB: não foi possível aceder.")
                process.exit(1)
            }

            //loads APP State
            var State = require('./controllers/state.js')
            State.reset()

            //loads APP travessia
            var travessia = require('./controllers/travessia.js')
            travessia.reset()

            //avisa que o servidor está pronto a receber pedidos
            emit()
        }else{
            console.error("MongoDB: não foi possível aceder.")
            process.exit(1)
        }
    })
    .catch(() => {
        console.error('MongoDB: não foi possível aceder.')
        process.exit(1)
    })

//Swagger
const swaggerUi = require('swagger-ui-express');
const options = require('./config/swagger').options
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, options));

// Cors init
var cors = require('cors')
app.use(cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:8081",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  })
  );

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
app.use('/api/indicadores', require('./routes/api/indicadores'));

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
