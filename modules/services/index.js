var log     = require("../logs");
var _       = require("underscore");
var db      = process.db;
var modules =
{
	google    : require("./google"),
	facebook  : require("./facebook"),
	instagram : require("./instagram"),
	uploads   : require("./uploads")
};

function getPhotos(userId, cb)
{
	db.users.read(["id", "=", userId], function (err, results)
	{
		if (err)
		{
			return cb(err);
		}

		var user = results[0];

		if (!user)
		{
			return cb("User Not Found");
		}

		runPhotoServices(user, cb);
	});
}

function runPhotoServices(user, cb)
{
	var photos        = [];
	var totalComplete = 0;
	var totalRan      = 0;
	var aborted       = false;

	for (var key in modules)
	{
		var options = user.services[key];

		if (options.active)
		{
			// run services asyncroniously
			_.defer(modules[key].getPhotos, user, onServiceComplete);
			totalRan++;
		}
	}

	function onServiceComplete(err, results)
	{
		if(aborted)
		{
			return;
		}

		if(err)
		{
			cb(err);
			aborted = true;
			return;
		}

		photos = photos.concat(results);

		if(++totalComplete < totalRan)
		{
			return;
		}

		cb(null, photos);
	}
}

function activate(args, cb)
{
	var data =
	{
		services : {}
	}

	data.services[args.service] =
	{
		active       : true,
		accessToken  : args.login.accessToken  || "",
		refreshToken : args.login.refreshToken || "",
		id           : args.login.id
	}

	if(args.service === "google")
	{
		data.tos =
		{
			notications :
			{
				chrome : true
			}
		};
	}

	if(args.service === "facebook")
	{
		data.tos =
		{
			notications :
			{
				facebook : true
			}
		};
	}

	db.users.update(args.userId, data, function (err, user)
	{
		if (err)
		{
			return cb(err);
		}

		cb(null, user);
	});
}

module.exports =
{
	getPhotos : getPhotos,
	activate  : activate
};
