var log        = require('../../modules/logs.js');
var db         = process.db;
var bucket     = require("../../modules/buckets").stories;
var multiparty = require("multiparty");
var express    = require("express");
var router     = express.Router();

router.use("/", function (req, res, next)
{
	// proceed only if the admin has stories permission
	if (req.permissions.indexOf("stories") > -1)
	{
		return next()
	}

	res.redirect("/");
});

router.get("/", function (req, res)
{
	db.stories.read(function (err, stories)
	{
		if (err)
		{
			return res.error("Database Error", err);
		}

		// sort stories by day then position
		stories.sort(function (a, b)
		{
			var aDay = a.day;
			var bDay = b.day;
			var aPos = a.position;
			var bPos = b.position;

			if (aDay == bDay)
			{
				return (aPos < bPos) ? -1 : (aPos > bPos) ? 1 : 0;
			}
			else
			{
				return (aDay < bDay) ? -1 : 1;
			}
		});

		// convert stories to array of days
		var days = [];
		var list = [];
		var day  = 0;

		for (var i = 0; i < stories.length; i++)
		{
			var story = stories[i];

			if (story.day !== day)
			{
				list = [];
				day  = story.day;
				days.push(list);
			}

			list.push(story);
		}

		var data =
		{
			title       : "Stories",
			days        : days,
			permissions : req.permissions,
			admin       : req.user
		};

		res.render("admin/stories", data);
	});
});

router.get("/edit/:id", function (req, res)
{
	db.stories.read(["id", "=", req.params.id], function (err, results)
	{
		if (err)
		{
			return res.error("Database Error", err);
		}

		var story = results[0];

		if (!story)
		{
			return res.error("Not Found", err);
		}

		var data =
		{
			title       : "Edit Story",
			story       : story,
			permissions : req.permissions,
			admin       : req.user
		};

		res.render("admin/editstory", data);
	});
});

router.post("/edit/:id", function (req, res)
{
	var form = new multiparty.Form();

	form.parse(req, function (err, fields, files)
	{
		if (err)
		{
			return res.error("Form Parse Error", err);
		}

		var localUrl    = files.image && files.image[0].size > 0 && files.image[0].path;
		var caption     = fields.caption && fields.caption[0];
		var description = fields.caption && fields.description[0];
		var weight      = fields.weight && fields.weight[0];
		var removeImage = fields.removeImage && fields.removeImage[0] === "true";
		var data        =
		{
			caption     : caption,
			description : description,
			weight      : weight
		};

		if(localUrl || removeImage)
		{
			data.imageUrl = localUrl || "";
		}

		db.stories.update(req.params.id, data, function (err, upload)
		{
			if (err)
			{
				return res.error("Database Error", err);
			}

			res.redirect("back");
		});
	});
});

module.exports = router;
