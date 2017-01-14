var log               = require('../../modules/logs.js');
var config            = require("../../modules/config");
var services          = require("../../modules/services");
var _                 = require("underscore");
var express           = require("express");
var router            = express.Router();
var Passport          = require("passport").Passport;
var passport          = new Passport();
var GoogleStrategy    = require("passport-google-oauth20").Strategy;
var FacebookStrategy  = require("passport-facebook").Strategy;
var InstagramStrategy = require("passport-instagram").Strategy;
var host              = config.HOST;

// add port to host for local development
if (config.ENV === "local")
{
	host += ":" + config.PORT;
}

// setup google user strategy
passport.use(new GoogleStrategy(
	{
		clientID          : config.GOOGLE_CLIENT_ID,
		clientSecret      : config.GOOGLE_CLIENT_SECRET,
		callbackURL       : host + "/services/google/callback",
		passReqToCallback : true,
		scope             : ['https://picasaweb.google.com/data/', 'profile']
	},
	function (req, accessToken, refreshToken, profile, cb)
	{
		var data =
		{
			service : "google",
			userId  : req.user.id,
			login   :
			{
				id           : profile.id,
				accessToken  : accessToken,
				refreshToken : refreshToken
			}
		};

		services.activate(data, function (err)
		{
			if (err)
			{
				return _.defer(cb, err);
			}

			_.defer(cb, null, profile);
		});
	}));

// setup facebook user strategy
passport.use(new FacebookStrategy(
	{
		clientID          : config.FACEBOOK_APP_ID,
		clientSecret      : config.FACEBOOK_APP_SECRET,
		callbackURL       : host + "/services/facebook/callback",
		profileFields     : ["photos"],
		passReqToCallback : true
	},
	function (req, accessToken, refreshToken, profile, cb)
	{
		var data =
		{
			service : "facebook",
			userId  : req.user.id,
			login   :
			{
				id           : profile.id,
				accessToken  : accessToken,
				refreshToken : refreshToken
			}
		};

		services.activate(data, function (err)
		{
			if (err)
			{
				return _.defer(cb, err);
			}

			_.defer(cb, null, profile);
		});
	}));

// setup instagram user strategy
passport.use(new InstagramStrategy(
	{
		clientID          : config.INSTAGRAM_CLIENT_ID,
		clientSecret      : config.INSTAGRAM_CLIENT_SECRET,
		callbackURL       : host + "/services/instagram/callback",
		passReqToCallback : true

	},
	function (req, accessToken, refreshToken, profile, cb)
	{
		var data =
		{
			service : "instagram",
			userId  : req.user.id,
			login   :
			{
				id           : profile.id,
				accessToken  : accessToken,
				refreshToken : refreshToken
			}
		};

		services.activate(data, function (err)
		{
			if (err)
			{
				return _.defer(cb, err);
			}

			_.defer(cb, null, profile);
		});
	}));

// setup google routes
router.get("/google/activate", passport.authorize("google",
{
	scope   : ["profile", "https://picasaweb.google.com/data/"],
	session : false
}));

router.get("/google/callback", passport.authorize("google"), function (req, res)
{
	res.redirect("/profile");
});

// setup facebook routes
router.get("/facebook/activate", passport.authorize("facebook",
{
	scope   : ["user_photos"],
	session : false
}));

router.get("/facebook/callback", passport.authorize("facebook"), function (req, res)
{
	res.redirect("/profile");
});

// setup instagram routes
router.get("/instagram/activate", passport.authorize("instagram",
{
	scope   : ["public_content"],
	session : false
}));

router.get("/instagram/callback", passport.authorize("instagram"), function (req, res)
{
	res.redirect("/profile");
});

module.exports = router;
