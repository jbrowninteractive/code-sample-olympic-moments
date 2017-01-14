var log     = require('../../modules/logs.js');
var db      = process.db;
var express = require("express");
var router  = express.Router();

// check auth and admin
router.use(function (req, res, next)
{
	// redirect if the user is not authenticated and not an admin
	if (!req.isAuthenticated || !req.isAdmin)
	{
		return res.redirect("/");
	}

	next();
});

// add and parse filters
router.use(function (req, res, next)
{
	// create filter array on request
	req.filters = [];

	if (!req.query.filter)
	{
		return next();
	}

	// add filters that came as query values
	var list = Array.isArray(req.query.filter) ? req.query.filter : [req.query.filter];

	for (var i = 0; i < list.length; i++)
	{
		var item     = String(list[i]);
		var parts    = item.split("|");
		var key      = parts[0];
		var operator = parts[1];
		var value    = parts[2];

		if (!key || !operator || value == null)
		{
			continue;
		}

		switch (key)
		{
			case "id"          :
			case "userId"      :
			case "storyId"     :
			case "momentId"    :
			case "uploadId"    :
			case "shareId"     :
			case "created"     :
			case "login.last"  :
			case "login.total" :
			{
				value = Number(value)
				break;
			}
		}

		switch (value)
		{
			case "true" :
			{
				value = true;
				break;
			}

			case "false" :
			{
				value = false;
				break;
			}
		}

		req.filters.push([key, operator, value]);
	}

	next();
});

router.get("/", function (req, res)
{
	var data =
	{
		title       : "Admin Panel",
		permissions : req.permissions,
		admin       : req.user
	};

	res.render("admin/index", data);
});

router.get("/image", function (req, res)
{
	var data =
	{
		src : unescape(req.query.src)
	};

	res.render("admin/image", data);
});

router.get("/lists/email", function(req, res)
{
	var filter =
	[
		["banned", "=", false],
		["tos.notifications.email", "=", true],
	];

	db.users.read(filter, function(err, users)
	{
		var data =
		{
			users : users
		};

		res.render("admin/email-list", data);
	});
});

router.get("/lists/facebook", function(req, res)
{

	var filter =
	[
		["banned", "=", false],
		["tos.notifications.facebook", "=", true],
	];

	db.users.read(filter, function(err, users)
	{
		var data =
		{
			users : users
		};

		res.render("admin/facebook-list", data);
	});
});


router.use("/stories", require("./stories"));
router.use("/users",   require("./users"));
router.use("/moments", require("./moments"));
router.use("/shares",  require("./shares"));

module.exports = router;
