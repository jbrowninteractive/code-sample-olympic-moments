var gcloud = require('gcloud');
var config = require("../config");
var gcs    = gcloud.storage({ projectId: config.GCLOUD_PROJECT });

class Bucket
{
	constructor(name)
	{
		this.name   = name;
		this.bucket = gcs.bucket(name);
	}

	addImage(path, type, cb)
	{
		if(typeof type === "function")
		{
			cb   = type;
			type = 'jpg';
		}

		var self    = this;
		var ext     = type ? "." + type : "";
		var dest    = new Date().getTime() + "-" + Math.floor(Math.random() * 10000000000) + ext;
		var options =
		{
			public      : true,
			destination : dest
		};

		self.bucket.upload(path, options, function (err, file)
		{
			if (err)
			{
				return cb(err);
			}

			var url = "https://storage.googleapis.com/" + self.name + "/" + file.name;

			cb(null, url);
		});
	}
}

module.exports = Bucket;
