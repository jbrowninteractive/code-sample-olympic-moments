
var config = require("../config");
var geo    = require("../geo/");

function isAuthenticated(user)
{
	return Boolean(user);
}

function isAdmin(user)
{
	if(!user)
	{
		return;
	}

	var id       = user.login.id;
	var platform = user.login.platform;

	for (var i = 0; i < config.ADMINS.length; i++)
	{
		var admin = config.ADMINS[i];

		if (admin.id === id && admin.platform === platform)
		{
			return true;
		}
	}
}

function getPermissions(user)
{
	if (!user)
	{
		return [];
	}

	var id       = user.login.id;
	var platform = user.login.platform;

	for (var i = 0; i < config.ADMINS.length; i++)
	{
		var admin = config.ADMINS[i];

		if (admin.id === id && admin.platform === platform)
		{
			return admin.permissions || [];
		}
	}

	return [];
}

function getPages(req, list, limit, count)
{
	var pages = null;

	if(count <= list.length)
	{
		return;
	}

	pages = [];

	var total  = Math.ceil(count / limit);
	var search = req.originalUrl.split("?")[1];
	var url    = req.baseUrl + "?";

	if(search)
	{
		var list = search.split("&");

		for (var i=list.length-1; i>=0; i--)
		{
			var item = list[i];

			if(item.indexOf("offset=") === 0)
			{
				list.splice(i, 1);
			}
		}

		url += list.join("&");
	}

	if(url.charAt(url.length-1) !== "?")
	{
		url += "&";
	}

	for(var i=0; i<total; i++)
	{
		var offset = limit * i;
		var page   =
		{
			url    : url + "offset="  + offset,
			number : i + 1,
			offset : offset
		};

		pages.push(page);
	}

	return pages;
}

function getLocation(req, cb)
{
	var ip = getIp(req);

	geo.getLocation(ip).then(function(location)
	{
		cb(null, location);

	}).catch(function(err)
	{
		cb(err);
	});
}

function getGeoEligible(req, cb)
{
	var bypass = req.cookies.geo === "false" || config.ENV === "local";

	if(bypass)
	{
		return cb(true);
	}

	getLocation(req, function(err, location)
	{
		if(err || location.country !== "Brasil")
		{
			return cb(false);
		}

		return cb(true);
	});
}

function getIp(req)
{
	return req.headers['x-appengine-user-ip'] ||
		   req.headers['x-forwarded-for']     ||
		   req.connection.remoteAddress        ;
}

function getNextPage(req, startVal)
{
	if(!startVal)
	{
		return null;
	}

	var search = req.originalUrl.split("?")[1];
	var url    = req.baseUrl + "?";

	if(!search)
	{
		return url + "startVal=" + startVal;
	}

	var list = search.split("&");

	for (var i=list.length-1; i>=0; i--)
	{
		var item = list[i];

		if(item.indexOf("startVal=") === 0)
		{
			continue;
		}

		if(url.charAt(url.length-1) !== "?")
		{
			url += "&";
		}

		url += item;
	}

	return url + "&startVal=" + encodeURIComponent(startVal);
}

module.exports =
{
	isAuthenticated : isAuthenticated,
	isAdmin         : isAdmin,
	getPermissions  : getPermissions,
	getPages        : getPages,
	getGeoEligible  : getGeoEligible,
	getIp           : getIp,
	getLocation     : getLocation,
	getNextPage     : getNextPage
};
