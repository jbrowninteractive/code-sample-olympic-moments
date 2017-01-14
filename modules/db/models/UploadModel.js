var Model = require("./Model");
var kind = "Upload";

class UploadModel extends Model
{
	constructor()
	{
		super(kind);
	}
}

module.exports = UploadModel;
