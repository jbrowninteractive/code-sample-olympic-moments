
var request = require("request");
var config  = require("../config");
var db      = process.db;
var brt     = require("../brt");

function addMoment(momentId, cb)
{
	cb = cb || process.noop;

	// 1. get moment by id
	db.moments.read(["id", "=", momentId], function(err, results)
	{
		if(err)
		{
			return cb(err);
		}

		var moment = results[0];

		if(!moment)
		{
			return cb(new Error("Invalid Moment ID"));
		}

		// 2. get user by id
		db.users.read(["id", "=", moment.userId], function(err, results)
		{
			if(err)
			{
				return cb(err);
			}

			var user = results[0];

			if(!user)
			{
				return cb(new Error("Invalid User ID"));
			}

			// 3. send data to google api
			var str     = config.GAPI_USERNAME + ":" + config.GAPI_PASSWORD;
			var auth    = "Basic " + new Buffer(str).toString("base64");
			var options =
			{
				url     : config.GAPI_URL,
				method  : "POST",
				headers :
				{
					"Authorization": auth
				},
				json :
				{
					"user"     : user.id,
					"userName" : user.login.displayName,
					"image"    : moment.imageUrl,
					"datetime" : brt.convert(moment.imageTimestamp, "YYYY-MM-DD HH:mm:ss")
				}
			};

			request(options, function(err, res, result)
			{
				if(err)
				{
					return cb(err);
				}

				if(res.statusCode !== 200)
				{
					return cb(new Error("Request Error:", res.statusCode));
				}

				var data =
				{
					commercialId : result.id
				};

				db.moments.update(moment.id, data, function(err, moment)
				{
					if(err)
					{
						return cb(err);
					}

					cb(null, moment.commercialId);
				});
			});
		});
	});
}

function removeMoment(momentId, cb)
{
	cb = cb || process.noop;

	// 1. get moment by id
	db.moments.read(["id", "=", momentId], function(err, results)
	{
		if(err)
		{
			return cb(err);
		}

		var moment = results[0];

		if(!moment)
		{
			return cb(new Error("Invalid Moment ID"));
		}

		// 2. remove data from google api
		var url     = config.GAPI_URL + "?imageId=" + moment.commercialId;
		var str     = config.GAPI_USERNAME + ":" + config.GAPI_PASSWORD;
		var auth    = "Basic " + new Buffer(str).toString("base64");
		var options =
		{
			url     : url,
			method  : "DELETE",
			headers :
			{
				"Authorization": auth
			}
		};

		request(options, function(err, res)
		{
			if(err)
			{
				return cb(err);
			}

			if(res.statusCode !== 200)
			{
				return cb(new Error("Request Error:" + res.statusCode));
			}

			cb(null);
		});
	});
}

function removeUser(userId, cb)
{
	cb = cb || process.noop;

	// 1. get user by id
	db.users.read(["id", "=", userId], function(err, results)
	{
		if(err)
		{
			return cb(err);
		}

		var user = results[0];

		if(!user)
		{
			return cb(new Error("Invalid User ID"));
		}

		// 2. remove data from google api
		var url     = config.GAPI_URL + "?userId=" + user.id;
		var str     = config.GAPI_USERNAME + ":" + config.GAPI_PASSWORD;
		var auth    = "Basic " + new Buffer(str).toString("base64");
		var options =
		{
			url     : url,
			method  : "DELETE",
			headers :
			{
				"Authorization": auth
			}
		};

		request(options, function(err, res)
		{
			if(err)
			{
				return cb(err);
			}

			if(res.statusCode !== 200)
			{
				return cb(new Error("Request Error:", res.statusCode));
			}

			cb(null);
		});
	});
}

module.exports =
{
	addMoment    : addMoment,
	removeMoment : removeMoment,
	removeUser   : removeUser
};
