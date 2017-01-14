var mod = require("node-geoip")
var geoip = new mod.GeoIP(mod.Database);

var geo = require('geoip2');
geo.init('./maxmind/GeoIP2-City-South-America.mmdb');

function getLocation(ip)
{
	return new Promise(function(resolve, reject)
	{
		// Callback for lookup
		var fn = function(err, result)
		{
			// Return error
			if (err || !result)
			{
				resolve(
				{
					error: (err) ? err : 'No result'
				});

				return;
			}

			// Check to see there is a country/city with IP
			if (result.country && result.city)
			{
				// Create a location object.
				var obj = {
					country: result.country.names['pt-BR'] || result.country.names['en'],
					city: result.city.names['pt-BR'] || result.city.names['en']
				};

				// Only send back eligible objects
				if (obj.country == 'Brasil' || obj.country == 'Brazil')
				{
					resolve(obj);
				}
				else
				{
					resolve(
					{
						error: 'Outside country'
					});
				}
			}
			else
			{
				resolve(
				{
					error: 'Undetectable City or Country.'
				});
			}
		}

		geo.lookup(ip, fn);
	});
}

module.exports = {
	getLocation: getLocation
};
