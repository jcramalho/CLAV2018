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

// Logging na consola do admin
var logger = require('morgan')

var Logs = require('./controllers/api/logs')
var aggLogs = require('./controllers/api/aggregateLogs')
var dataBases = require('./config/database');
var Key = require('./models/chave');

//Lê e interpreta os dados enviados pelo serviço de autenticação e de autorização
app.use((req, res, next) => {
    servAuth = JSON.parse(req.headers["clav-auth"])
    if("id" in servAuth){
        res.locals.id = servAuth.id
    }
    if("idType" in servAuth){
        res.locals.idType = servAuth.idType
        delete servAuth.idType

        if(res.locals.idType == "User"){
            req.user = servAuth
        }else if(res.locals.idType == "Chave"){
            //Atualiza a Chave API por forma a indicar que foi utilizada
            try{
                await Key.updateOne(
                    {_id: servAuth.id},
                    {$inc: {nCalls: 1}, lastUsed: Date.now()}
                )
            }catch(err){
                console.log("Erro ao atualizar a chave API")
            }
        }
    }
    next();
});

//log dos pedidos
app.use((req, res, next) => {
    res.on('finish', async () => {
        var route = Logs.getRoute(req)

        if(route){
            if(!res.locals.id || !res.locals.idType){
                res.locals.id = "Desconhecido"
                res.locals.idType = "Desconhecido"
            }

            Logs.newLog(route, req.method, res.locals.id, res.locals.idType, res.statusCode)
            route = route.match(/^\/[^/]*/)[0]
            try{
                aggLogs.newAggregateLog(route, req.method, res.locals.id, res.locals.idType)      
            }catch(err){
                console.log("Erro ao adicionar Agg Log: " + err)
            }
        }
    });
    next();
});

//config
app.use(express.static(__dirname + '/public'));

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

            //loads APP travessia de sintese
            var travessiaDeSintese = require('./controllers/travessiaDeSintese.js')
            travessiaDeSintese.reset()

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

//formatar o resultado consoante a querystring fs
const { outputFormat } = require('./routes/outputFormat.js')

//routes and API
mainRouter.use('/entidades',require('./routes/api/entidades'), outputFormat);
mainRouter.use('/tipologias',require('./routes/api/tipologias'), outputFormat);
mainRouter.use('/legislacao',require('./routes/api/leg'), outputFormat);
mainRouter.use('/classes',require('./routes/api/classes'), outputFormat);
mainRouter.use('/noticias',require('./routes/api/noticias'));
mainRouter.use('/documentacaoApoio',require('./routes/api/documentacaoApoio'));
mainRouter.use('/documentacaoCientifica',require('./routes/api/documentacaoCientifica'));
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
mainRouter.use('/travessiaV2',require('./routes/api/travessiaV2'));
mainRouter.use('/travessia',require('./routes/api/travessia'));
mainRouter.use('/travessiaDeSintese',require('./routes/api/travessiaDeSintese'));
mainRouter.use('/travessiaEspecial',require('./routes/api/travessiaEspecial'));
mainRouter.use('/invariantes',require('./routes/api/invariantes'));
mainRouter.use('/auth', require('./routes/api/auth'));
mainRouter.use('/ontologia', require('./routes/api/ontologia'));
mainRouter.use('/reload', require('./routes/api/reload'));
mainRouter.use('/logsAgregados', require('./routes/api/aggregateLogs'));
mainRouter.use('/logs', require('./routes/api/logs'));
mainRouter.use('/indicadores', require('./routes/api/indicadores'));
mainRouter.use('/parametros', require('./routes/api/parametros'));

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
