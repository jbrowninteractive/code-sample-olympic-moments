var pkg      = require("../../package.json");
var fs       = require("fs");
var merge    = require("object-merge");
var values   = ["local", "staging", "production"];
var env      = process.env.ENV;
var dir      = __dirname + "/data/";
var defaults = JSON.parse(fs.readFileSync(dir + "defaults.json"));
var ip       = require('ip');

// ensure the ENV variable is in the list of the accepted values.
// if not assume we are working locally
if (values.indexOf(env) === -1)
{
	env = "local";
}

// do a try catch because local.json is gitignored and may throw
// a file not found error if developer has not created it locally
try
{
	var additions = JSON.parse(fs.readFileSync(dir + env + ".json"));

	if (additions.ADMINS)
	{
		additions.ADMINS = additions.ADMINS.concat(defaults.ADMINS);
	}

	module.exports = merge(defaults, additions);
}
// if an error is caught assume the developer wants to use the
// default settings if no local.json file is found
catch (e)
{
	module.exports = defaults;
}

// create and set TEMP_DIR
// see linux spec: http://refspecs.linuxfoundation.org/FHS_2.3/fhs-2.3.html#TMPTEMPORARYFILES
var rnd = new Date().getTime() + "" + Math.floor(Math.random() * 100000);
var dir = "/tmp/com.claro-timeline-production." + rnd + "/";
if(!fs.existsSync(dir))
{
	fs.mkdirSync(dir);
}
module.exports.TEMP_DIR = dir;

// set MEMCACHE_URL based on env
var memcachedAddr = process.env.MEMCACHE_PORT_11211_TCP_ADDR || "localhost";
var memcachedPort = process.env.MEMCACHE_PORT_11211_TCP_PORT || "11211";
module.exports.MEMCACHE_URL = memcachedAddr + ":" + memcachedPort;

// add ip address to server config
module.exports.IP_ADDRESS = ip.address();

// add application version to module exports
module.exports.VERSION = pkg.version;

// add the ENV variable to the module exports
module.exports.ENV = env;
