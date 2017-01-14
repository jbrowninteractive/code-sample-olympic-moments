
var config  = require("../../modules/config");
var db      = process.db;
var utils   = require("../../modules/utils/routes");
var express = require("express");
var router  = express.Router();
var limit   = config.ADMIN_PAGE_LIMIT;

router.use("/", function (req, res, next)
{
	// proceed only if the admin has shares permission
	if (req.permissions.indexOf("shares") > -1)
	{
		return next()
	}

	res.redirect("/");
});

router.get("/", function (req, res)
{
	var offset  = Number(req.query.offset) || 0;
	var options =
	{
		filters  : req.filters,
		offset   : offset,
		limit    : limit,
		startVal : req.query.startVal && decodeURIComponent(req.query.startVal)
	};

	db.shares.read(options, function (err, shares, count, startVal)
	{
		if (err)
		{
			return res.error("Database Error", err);
		}

		var data =
		{
			title       : "Shares",
			shares      : shares,
			permissions : req.permissions,
			admin       : req.user,
			offset      : offset,
			pages       : utils.getPages(req, shares, limit, count),
			count       : count,
			nextPage    : utils.getNextPage(req, startVal)
		};

		res.render("admin/shares", data);
	});
});

module.exports = router;
