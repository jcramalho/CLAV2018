//Basic webserver
var express = require('express'),
    app = express();

//body parser for post requests
var bodyParser = require('body-parser')
app.use(bodyParser.json({limit: '50mb'}));         // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({
    limit : '50mb',
    // to support URL-encoded bodies
    extended: true,
    parameterLimit:50000
}));

//CORS
var cors = require('cors')
const corsOpts = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Authorization', 'Cache-Control', 'Content-Type', 'DNT', 'If-Modified-Since', 'Keep-Alive', 'Origin', 'User-Agent', 'X-Requested-With', 'Content-Length']
}
app.use(cors(corsOpts))
app.options('*', cors(corsOpts))

// Logging na consola do admin
var logger = require('morgan')

//Funcao auxiliar para contar numero de GET e POST
var apiStats = require('./models/api')
var Logs = require('./controllers/api/logs')
var aggregateLogs = require('./controllers/api/aggregateLogs')
var dataBases = require('./config/database');

function getRoute(req){
    const route = req.route ? req.route.path : '' // check if the handler exist
    var baseUrl = req.baseUrl ? req.baseUrl : '' // adding the base url if the handler is a child of another handler
 
    // return route ? `${baseUrl === '/' ? '' : baseUrl}${route}` : 'unknown route'
    // remove API version from url
    baseUrl = baseUrl ? baseUrl.split(dataBases.apiVersion)[1] : baseUrl
    return route ? `${baseUrl === '/' ? '' : baseUrl}` : 'unknown route'
}

app.use((req, res, next) => {
    res.on('finish', async () => {
        //console.log('_DEBUG_:' + `${req.method} ${getRoute(req)} ${res.statusCode}`) 
        if(getRoute(req).includes('/' + dataBases.apiVersion + '/')){
            apiStats.addUsage(req.method, getRoute(req));
        }

        if(res.locals.id && res.locals.idType){
            Logs.newLog(Logs.getRoute(req), req.method, res.locals.id, res.locals.idType, res.statusCode)
            try{
                aggregateLogs.newAggregateLog(req.method, res.locals.id, res.locals.idType)      
            }catch(err){
                console.log("Erro ao criar/atualizar o log agregado.")
            }
        }
    });
    next();
});

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
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
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

            //clean old logs
            Logs.removeOldLogs()
            //clean old logs periodically
            Logs.removeOldLogsPeriodically()

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

var mainRouter = express.Router()

//Swagger
const swaggerUi = require('swagger-ui-express');
const options = require('./config/swagger').options
mainRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(null, options));

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
mainRouter.use('/entidades',require('./routes/api/entidades'), outputFormat);
mainRouter.use('/tipologias',require('./routes/api/tipologias'), outputFormat);
mainRouter.use('/legislacao',require('./routes/api/leg'), outputFormat);
mainRouter.use('/classes',require('./routes/api/classes'), outputFormat);
mainRouter.use('/notasAp',require('./routes/api/notasAp'));
mainRouter.use('/exemplosNotasAp',require('./routes/api/exemplosNotasAp'));
mainRouter.use('/indicePesquisa',require('./routes/api/indicePesquisa'));
mainRouter.use('/tabelasSelecao',require('./routes/api/tabsSel'));
mainRouter.use('/termosIndice',require('./routes/api/termosIndice'));
mainRouter.use('/vocabularios',require('./routes/api/vocabularios'));
mainRouter.use('/autosEliminacao',require('./routes/api/autosEliminacao'));
mainRouter.use('/pedidos',require('./routes/api/pedidos'));
mainRouter.use('/pendentes',require('./routes/api/pendentes'));
mainRouter.use('/users',require('./routes/api/users'));
mainRouter.use('/chaves',require('./routes/api/chaves'));
mainRouter.use('/stats', require('./routes/api/stats'));
mainRouter.use('/travessia',require('./routes/api/travessia'));
mainRouter.use('/invariantes',require('./routes/api/invariantes'));
mainRouter.use('/auth', require('./routes/api/auth'));
mainRouter.use('/ontologia', require('./routes/api/ontologia'));
mainRouter.use('/reload', require('./routes/api/reload'));
mainRouter.use('/logsAgregados', require('./routes/api/aggregateLogs'));
mainRouter.use('/logs', require('./routes/api/logs'));
mainRouter.use('/indicadores', require('./routes/api/indicadores'));
mainRouter.use('/notificacoes', require('./routes/api/notificacoes'));

app.use('/' + dataBases.apiVersion, mainRouter);

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

    res.status(err.status || 500).send(`${err.message}`);
});

module.exports = app; 
