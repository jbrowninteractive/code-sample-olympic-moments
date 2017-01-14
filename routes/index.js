var config  = require("../modules/config");
var db      = process.db;
var log     = require("../modules/logs.js");
var utils   = require("../modules/utils/routes");
var express = require("express");
var router  = express.Router();

router.use(function (req, res, next)
{
	// set common request properties
	req.isAuthenticated = utils.isAuthenticated(req.user);
	req.permissions     = utils.getPermissions(req.user);
	req.isAdmin         = utils.isAdmin(req.user);
	req.ip              = utils.getIp(req);

	// add error logging middleware to the response
	res.error = function(message, details)
	{
		var error =
		{
			timestamp : new Date().getTime(),
			message   : message,
			details   : details,
			stack     : new Error().stack
		};

		if(config.ENV !== "local")
		{
			log.info(error);
			delete error.details;
			delete error.stack;
		}
		else
		{
			console.log(error);
		}

		var obj =
		{
			error : error
		};

		res.send(obj);
	};

	// add data formatting middleware to the response
	res.data = function(data)
	{
		var obj =
		{
			data : data
		};

		res.send(obj);
	};

	next();
});

// redirect request if the user is banned
router.use(function(req, res, next)
{
	if(req.isAuthenticated && req.user.banned)
	{
		req.logout();
		res.redirect("banned");
		return;
	}

	next();
});

router.get("/geopass", function(req, res)
{
	res.cookie("geo", "false");
	res.redirect("signin");
});

router.get("/geofence", function(req, res)
{
	res.render("geofence");
});

router.get("/share/details/:id", function(req, res)
{
	db.shares.getShare(Number(req.params.id), function(err, share)
	{
		log.info(share);

		if(err)
		{
			return res.error(err);
		}

		res.render("share",
		{
			pageId   : req.params.id,
			title    : "Share",
			share    : share,
			whatsapp : req.query.whatsapp
		});
	});
});

// enforce geofencing
router.use(function(req, res, next)
{
	utils.getGeoEligible(req, function(isGeoEligible)
	{
		if(!isGeoEligible)
		{
			return res.redirect("/geofence");
		}

		next();
	});
});

router.get("/", function(req, res)
{
	if(req.isAuthenticated)
	{
		return res.redirect("/profile");
	}

	res.render("intro",
	{
		title : "Home"
	});
});

router.get("/profile", function(req, res)
{
	if(!req.isAuthenticated)
	{
		return res.redirect("/");
	}

	utils.getLocation(req, function(err, location)
	{
		res.render("profile",
		{
			title     : "Profile",
			is_mobile : req.device.type == "phone" || req.device.type == "mobile",
			user      : req.user,
			loc       : location || {},
			isVideo   : req.query.video
		});
	});

});

router.get("/intro", function(req, res)
{
	res.render("intro_v2");
});

router.get("/intro_post", function(req, res)
{
	res.render("intro_post");
});

router.get("/tos", function(req, res)
{
	if(!req.isAuthenticated)
	{
		return res.redirect("/");
	}

	if(req.user.tos.application)
	{
		return res.redirect("/profile");
	}

	var data =
	{
		user : req.user
	};

	res.render("tos", data);
});

router.get("/signin", function(req, res)
{
	res.render("signin");
});

router.get("/terms", function(req, res)
{
	res.render("terms");
});

router.post("/facebook/canvas", function(req, res)
{
	res.redirect("/");
});

module.exports = router;
