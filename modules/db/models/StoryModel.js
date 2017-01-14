var Model = require("./Model");
var kind = "Story";

class StoryModel extends Model
{
	constructor()
	{
		super(kind);
	}
}

module.exports = StoryModel;
