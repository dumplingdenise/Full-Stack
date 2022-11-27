function initialiseTitle() {
	let title = $("#name").val();
	console.log(title);
	let titleArr = [];
	let initTitle = "";
	if (title) {
		titleArr = title.trim().split(" ");
		for (let i = 0; i < titleArr.length; i++) {
			initTitle += titleArr[i].charAt(0).toUpperCase() + titleArr[i].slice(1) + (i == titleArr.length - 1 ? "" : " ");
		}
		$("#name").val(initTitle);
	}
}

// Display selected file name
$(".custom-file-input").on("change", function () {
	var fileName = $(this).val().split("\\").pop();
	$(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});

$("#posterUpload").on("change", function () {
	let formdata = new FormData();
	let image = $("#posterUpload")[0].files[0];
	formdata.append("posterUpload", image);
	fetch("/user/upload", {
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
