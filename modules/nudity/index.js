var config       = require("../config");
var db           = process.db;
var request      = require("request");
var fs           = require("fs");
var API_ENDPOINT = "http://api.sightengine.com/";
var API_VERSION  = "1.0";
var timer        = null;

function start()
{
	timer = setInterval(getMoments, config.NUDITY_API_INTERVAL);
	start = process.noop;
}

function getMoments()
{
	var i      = -1;
	var filter =
	[
		["banned",         "=", false],
		["nudity.scanned", "=", false]
	];

	db.moments.read(filter, function(err, moments)
	{
		if(err)
		{
			return;
		}

		function check()
		{
			if(++i === moments.length)
			{
				return;
			}

			checkMoment(moments[i], check);
		}

		check();
	});
}

function checkMoment(moment, cb)
{
	if(moment.service !== "uploads" && moment.service !== "google")
	{
		return cb();
	}

	scanUrl(moment.imageUrl, function(err, result)
	{
		if(err)
		{
			return cb();
		}

		var data =
		{
			nudity :
			{
				scanned : true,
				result  : result
			}
		}

		db.moments.update(moment.id, data, process.noop);

		cb();
	});
}

function scanUrl(imageUrl, cb)
{
	cb = cb || process.noop;

	var url  = API_ENDPOINT + "/" + API_VERSION + "/nudity.json?api_user=";
		url += config.NUDITY_API_USER + "&api_secret=";
		url += config.NUDITY_API_SECRET + "&url=" + imageUrl;

	request(url, function(err, res, body)
	{
		if(err)
		{
			return cb(err);
		}

		if(res.statusCode !== 200)
		{
			return cb(new Error("Invalid Nudity API Response"));
		}

		try
		{
			var data = JSON.parse(res.body);
		}
		catch(err)
		{
			return cb(err);
		}

		if(data.status !== "success")
		{
			cb(new Error("Nudity API Error"));
		}

		var result = data.nudity.result && data.nudity.confidence >= config.NUDITY_MIN_CONFIDENCE;

		cb(null, Boolean(result));
	});
}

function scanFile(imagePath, cb)
{
	cb = cb || process.noop;

	var data =
	{
		url      : API_ENDPOINT + "/" + API_VERSION + "/nudity.json",
		formData :
		{
			api_user   : config.NUDITY_API_USER,
			api_secret : config.NUDITY_API_SECRET,
			photo      :
			{
				value   : fs.createReadStream(imagePath),
				options :
				{
					filename : + new Date().getTime() + "-" + Math.floor(Math.random() * 100000)
				}
			}
		}
	};

	request.post(data, function(err, res, body)
	{
		if(err)
		{
			return cb(err);
		}

		if(res.statusCode !== 200)
		{
			return cb(new Error("Invalid Nudity API Response"));
		}

		try
		{
			var data = JSON.parse(res.body);
		}
		catch(err)
		{
			return cb(err);
		}

		if(data.status !== "success")
		{
			cb(new Error("Nudity API Error"));
		}

		var result = data.nudity.result && data.nudity.confidence >= config.NUDITY_MIN_CONFIDENCE;

		cb(null, Boolean(result));
	});
}

module.exports =
{
	start    : start,
	scanUrl  : scanUrl,
	scanFile : scanFile
};
