(function () {

	var container = document.getElementById("image-container");
	var imageLink = document.getElementById("image-a");
	var imageNode = document.getElementById("story-image");
	var imageInput = document.getElementById("image-input");
	var removeImageBtn = document.getElementById("remove-image");
	var removeImageInput = document.getElementById("remove-input");

	imageInput.onchange = function ()
	{
		if (imageInput.files.length > 0)
		{
			var reader = new FileReader();

			reader.onload = function (e)
			{
				container.style.display = "block";
				removeImageInput.value = false;
				imageNode.src = e.target.result;

				if (imageLink.parentNode)
				{
					imageLink.parentNode.appendChild(imageNode);
					imageLink.parentNode.removeChild(imageLink);
				}
			}

			reader.readAsDataURL(imageInput.files[0]);
		}
	};

	removeImageBtn.onclick = function ()
	{
		container.style.display = "none"
		removeImageInput.value = true;
		imageInput.value = "";
	};

})();