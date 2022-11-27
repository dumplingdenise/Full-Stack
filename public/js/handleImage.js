$(".custom-file-input").on("change", function () {
	var fileName = $(this).val().split("\\").pop();
	$(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});

$("#posterUpload").on("change", function () {
	let formdata = new FormData();
	let image = $("#posterUpload")[0].files[0];
	formdata.append("posterUpload", image);
	fetch("/event/upload", {
		method: "POST",
		body: formdata
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.err) {
				$("#posterErr").text(data.err.message);
				$("#posterErr").show();
			} else {
				if (data.file) {
					$("#poster").attr("src", data.file);
					$("#posterURL").attr("value", data.file); // set hidden field
				}
				$("#posterErr").hide();
			}
		});
});
