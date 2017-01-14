var UserModel   = require("./models/UserModel");
var StoryModel  = require("./models/StoryModel");
var MomentModel = require("./models/MomentModel");
var UploadModel = require("./models/UploadModel");
var ShareModel  = require("./models/ShareModel");

module.exports =
{
	users   : new UserModel(),
	stories : new StoryModel(),
	moments : new MomentModel(),
	uploads : new UploadModel(),
	shares  : new ShareModel()
};
