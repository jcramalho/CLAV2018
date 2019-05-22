//Basic webserver
var express = require('express'),
    app = express();

// Logging na consola do admin
var logger = require('morgan')

// Para permitir pedidos à API vindos de outros serviços internos
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Origin, Accept');
    next();
});

//body parser for post requests
var bodyParser = require('body-parser')
app.use(bodyParser.json());         // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

//Server JWT gen
var serverKey = require('./models/keys')
serverKey.generateServerKey();

//authentication dependencies
var cookieParser = require('cookie-parser');
var expressValidator = require('express-validator');
var passport = require('passport');
var flash = require('connect-flash');

//MongoDB session setuo
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var dataBases = require('./config/database');
var mongoose = require('mongoose');

require('./config/passport')(passport);

//config
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

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

// Express Validator
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

// Logging middleware
app.use(logger('dev'))

// Connect Flash
app.use(flash());

// Connect mongo and mongoose
mongoose.Promise = global.Promise;
mongoose.connect(dataBases.userDB, {useMongoClient: true,})
    .then(()=> console.log('Mongo ready: ' + mongoose.connection.readyState))
    .catch(()=> console.log('Mongo: erro na conexão...'))

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo erro na conexão: '));

// Global Vars
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.warn_msg = req.flash('warn_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

//loads APP State
var State = require('./controllers/state.js')
State.reset()

//routes and API
app.use('/',require('./routes/index'));
app.use('/users',require('./routes/users'));
app.use('/organizacoes',require('./routes/orgs'));
app.use('/entidades',require('./routes/entidades'));
app.use('/tipologias',require('./routes/tipologias'));
app.use('/legislacao',require('./routes/leg'));
app.use('/classes',require('./routes/classes'));
app.use('/tabelasSelecao',require('./routes/tabsSel'));
app.use('/termosIndice',require('./routes/termosIndice'));
app.use('/gestao',require('./routes/admin'));
app.use('/pedidos',require('./routes/pedidos'));

//app.use('/api/organizacoes',require('./routes/api/orgs'));
app.use('/api/entidades',require('./routes/api/entidades'));
app.use('/api/tipologias',require('./routes/api/tipologias'));
app.use('/api/legislacao',require('./routes/api/leg'));
app.use('/api/classes',require('./routes/api/classes'));
app.use('/api/tabelasSelecao',require('./routes/api/tabsSel'));
app.use('/api/termosIndice',require('./routes/api/termosIndice'));
app.use('/api/vocabularios',require('./routes/api/vocabularios'));
app.use('/api/pedidos',require('./routes/api/pedidos'));
app.use('/api/trabalhos',require('./routes/api/trabalhos'));
app.use('/api/users',require('./routes/api/users'));
app.use('/api/chaves',require('./routes/api/chaves'));
app.use('/api/utils', require('./routes/api/utils'))
app.use('/auth',require('./routes/auth/user'));

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

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app; 