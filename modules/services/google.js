var log    = require('../logs');
var Picasa = require("../picasa");
var picasa = new Picasa();

function getPhotos(user, cb)
{
	var photos  = [];
	var options = user.services["google"];

	picasa.getAllPhotos(options.accessToken, options.id, function (results, err)
	{
		if (err)
		{
			return cb(err);
		}

		for (var i = 0; i < results.length; i++)
		{
			var result = results[i];
			var photo  =
			{
				timestamp : result.timestamp,
				imageUrl  : result.image_url,
				service   : "google"
			};

			photos.push(photo);
		}

		cb(null, photos);
	});
}

function share(user, cb)
{

}

module.exports =
{
	getPhotos : getPhotos
};
