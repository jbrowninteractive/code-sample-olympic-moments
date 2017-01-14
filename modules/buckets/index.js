var config = require("../config");
var Bucket = require("./Bucket");

module.exports =
{
	stories : new Bucket(config.GCLOUD_STORY_BUCKET),
	uploads : new Bucket(config.GCLOUD_USER_UPLOADS_BUCKET),
	videos  : new Bucket(config.GCLOUD_USER_VIDEOS_BUCKET),
	shares  : new Bucket(config.GCLOUD_USER_SHARES_BUCKET)
};
