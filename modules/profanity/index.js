
var fs   = require("fs");
var list = lower(fs.readFileSync(__dirname + "/list.txt", "utf8").trim().split("\n"));

function validate(value)
{
	if(typeof value !== "string")
	{
		return new Error("Invalid Argument: " + value);
	}

	var words = value.split(" ");

	for(var i=0; i<words.length; i++)
	{
	    var word = words[i];

	    if(list.indexOf(word.toLowerCase()) > -1)
	    {
	    	return new Error("Profanity Detected: " + word);
	    }
	}
}

function lower(list)
{
	for(var i=0; i<list.length; i++)
	{
		list[i] = list[i].toLowerCase();
	}

	return list;
}

module.exports =
{
	validate : validate
};
