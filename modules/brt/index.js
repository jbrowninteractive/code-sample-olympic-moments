
var moment = require("moment-timezone");

function convert(timestamp, format)
{
	timestamp = Number(timestamp);
	format    = format || "DD-MM-YY HH:mm:ss";
	var date  = moment(timestamp);
	var str   = date.tz("America/Sao_Paulo").format(format);
	return str;
}

module.exports.convert = convert;
