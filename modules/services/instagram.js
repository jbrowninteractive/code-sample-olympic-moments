var request  = require("request");
var endPoint = "https://api.instagram.com/v1/users/$ID/media/recent/?access_token=$TOKEN";

function getPhotos(user, cb)
{
	var service = user.services.instagram;
	var url     = endPoint.replace("$ID", service.id).replace("$TOKEN", service.accessToken);
	var photos  = [];

	request(url, function (err, res, body)
	{
		if (err)
		{
			return cb(err);
		}

		if (res.statusCode !== 200)
		{
			return cb(new Error("Instagram Service Error"));
		}

		try
		{
			body = JSON.parse(body);
		}
		catch (err)
		{
			return cb(err);
		}

		for (var i = 0; i < body.data.length; i++)
		{
			var result = body.data[i];

			if (result.type !== "image")
			{
				continue;
			}

			var photo =
			{
				timestamp : Number(result.created_time * 1000),
				imageUrl  : result.images.standard_resolution.url,
				service   : "instagram"
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
