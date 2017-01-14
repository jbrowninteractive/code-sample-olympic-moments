
var config  = require("../../modules/config");
var log     = require('../../modules/logs.js');
var db      = process.db;
var utils   = require("../../modules/utils/routes");
var express = require("express");
var router  = express.Router();
var limit   = config.ADMIN_PAGE_LIMIT;

router.use("/", function (req, res, next)
{
	// proceed only if the admin has moments permission
	if (req.permissions.indexOf("moments") > -1)
	{
		return next()
	}

	res.redirect("/");
});

router.get("/", function (req, res)
{
	req.filters.push(["banned", "=", false]);

	var offset  = Number(req.query.offset) || 0;
	var options =
	{
		filters  : req.filters,
		offset   : offset,
		limit    : limit,
		startVal : req.query.startVal && decodeURIComponent(req.query.startVal)
	};

	db.moments.read(options, function (err, moments, count, startVal)
	{
		if (err)
		{
			return res.error("Database Error", err);
		}

		var data =
		{
			title       : "Moments",
			moments     : moments,
			permissions : req.permissions,
			admin       : req.user,
			offset      : offset,
			pages       : utils.getPages(req, moments, limit, count),
			count       : count,
			nextPage    : utils.getNextPage(req, startVal)
		};

		res.render("admin/moments", data);
	});
});

router.post("/update", function(req, res)
{
	var completed = 0;
	var list      = req.body.list;

	if(!list || list.length === 0)
	{
		return res.data({});
	}

	for(var i=0; i<list.length; i++)
	{
	    var item = list[i];
	    var id   = Number(item.id);
	    var data = {};

	    if(item.hasOwnProperty("curated"))
	    {
	    	data.curated = item.curated === "true";
	    }

	    if(item.hasOwnProperty("delete"))
	    {
	    	data.banned = true;
	    }

	    if(item.hasOwnProperty("flagged"))
	    {
	    	data.flagged = item.flagged === "true";
	    }

	    if(item.hasOwnProperty("nudity"))
	    {
	    	data.nudity =
	    	{
	    		scanned : true,
	    		result  : item.nudity === "true"
	    	};

	    }

	    db.moments.update(id, data, onComplete);
	}

	function onComplete(err, moment)
	{
		if(err)
		{
			log.info(err);
		}

		if(++completed === list.length)
		{
			res.data({});
		}
	}
});

router.get("/delete/:id", function (req, res)
{
	// we're not deleting the moment from the db so we
	// can still reference any user's 'deleted' moments

	var data =
	{
		banned : true
	};

	db.moments.update(req.params.id, data, function (err, moment)
	{
		if (err)
		{
			return res.error("Database Error", err);
		}

		res.redirect("back");
	});
});

module.exports = router;
