
var config  = require("../../modules/config");
var log     = require('../../modules/logs.js');
var db      = process.db;
var utils   = require("../../modules/utils/routes");
var express = require("express");
var router  = express.Router();
var limit   = config.ADMIN_PAGE_LIMIT;

router.use("/", function (req, res, next)
{
	// proceed only if the admin has users permission
	if (req.permissions.indexOf("users") > -1)
	{
		return next()
	}

	res.redirect("/");
});

router.get("/", function (req, res)
{
	req.filters.push("banned", "=", false);

	var offset  = Number(req.query.offset) || 0;
	var options =
	{
		filters  : req.filters,
		offset   : offset,
		limit    : limit,
		startVal : req.query.startVal && decodeURIComponent(req.query.startVal)
	};

	db.users.read(options, function (err, users, count, startVal)
	{
		if (err)
		{
			return res.error("Database Error", err);
		}

		for (var u = 0; u < users.length; u++)
		{
			var user     = users[u];
			user.isAdmin = utils.isAdmin(user);
			getMoments(user);
		}

		var completed = 0;

		function getMoments(user)
		{
			var filters =
			[
				["banned", "=", false],
				["userId", "=", user.id]
			];

			db.moments.read(filters, function (err, moments)
			{
				user.moments = moments || [];

				if(++completed === users.length)
				{
					send();
				}
			});
		}


		function send()
		{
			var data =
			{
				title       : "Users",
				users       : users,
				permissions : req.permissions,
				admin       : req.user,
				offset      : offset,
				pages       : utils.getPages(req, users, limit, count),
				count       : count,
				nextPage    : utils.getNextPage(req, startVal)
			};

			res.render("admin/users", data);
		}
	});
});

router.get("/delete/:id", function (req, res)
{
	// we're not deleting the user from the db
	// otherwise they would simply sign up again

	var data =
	{
		banned : true
	};

	db.users.update(req.params.id, data, function (err, user)
	{
		if (err)
		{
			return res.error("Database Error", err);
		}

		// also ban the users moments
		db.moments.read(["userId", "=", user.id], function(err, moments)
		{
			if (err)
			{
				return res.error("Database Error", err);
			}

			for(var i=0; i<moments.length; i++)
			{
			    var moment = moments[i];
			    db.moments.update(moment.id, {banned : true});
			}

			res.redirect("back");
		});

	});
});

module.exports = router;
