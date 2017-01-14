var bucket = require("../buckets").uploads;
var db     = process.db;

function getPhotos(user, cb)
{
	db.uploads.read(["userId", "=", user.id], function (err, results)
	{
		if (err)
		{
			return cb(null, err);
		}

		var photos = [];

		for (var i = 0; i < results.length; i++)
		{
			var result = results[i];
			var photo  =
			{
				timestamp : result.timestamp,
				imageUrl  : result.imageUrl,
				service   : "uploads"
			};

			photos.push(photo);
		}

		cb(null, photos);
	});
}

module.exports =
{
	getPhotos : getPhotos
};
