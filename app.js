
// declare global noop
process.noop = function ()
{
	// do nothing
};

// declare global db
process.db = require("./modules/db");

// declare global gapi
process.gapi = require("./modules/gapi")

// declare global nudity
process.nudity = require("./modules/nudity");


// declar local vars
var config         = require("./modules/config");
var bunyan         = require("bunyan");
var express        = require("express");
var session        = require('express-session');
var MemcachedStore = require('connect-memcached')(session);
var passport       = require('passport');
var path           = require("path");
var device = require('express-device');
var favicon        = require("serve-favicon");
var cookieParser   = require("cookie-parser");
var bodyParser     = require("body-parser");
var log            = require('./modules/logs.js');
var app            = express();
var sessionConfig  =
{
	resave            : false,
	saveUninitialized : false,
	signed            : true,
	secret            : config.SESSION_SECRET
};


// use memcache session storage if we are not developing locally
if (config.ENV !== "local")
{
	sessionConfig.store = new MemcachedStore(
	{
		hosts : [config.MEMCACHE_URL]
	});
}

// start nudity api calls
// process.nudity.start();

// tell the app to use the session
app.use(session(sessionConfig));

// prerender for shares
//app.use(require('prerender-node'));

// express device
app.use(device.capture());
device.enableDeviceHelpers(app),

// disable etag header
app.disable('etag');

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// add date formatting modules to app locals for use in jade template
app.locals.brt = require("./modules/brt");

// tell the app to trust proxies
app.set('trust proxy', true);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// setup passport
app.use(passport.initialize());
app.use(passport.session());

// setup express routes
app.use("/",         require("./routes"));
app.use("/api",      require("./routes/api"));
app.use("/auth",     require("./routes/auth"));
app.use("/admin",    require("./routes/admin"));
app.use("/services", require("./routes/services"));


// catch 404 and forward to error handler
app.use(function (req, res, next)
{
	var err    = new Error("Not Found");
	err.status = 404;
	next(err);
});

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
  next();
});


// development error handler
// will print stacktrace
if (config.ENV === "local")
{
	app.use(function (err, req, res, next)
	{
		res.status(err.status || 500);
		res.render("error",
		{
			message : err.message,
			error   : err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next)
{
	res.status(err.status || 500);
	res.render("error",
	{
		message : err.message,
		error   : {}
	});
});

module.exports = app;
