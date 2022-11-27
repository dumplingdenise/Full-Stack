const togglePassword = (el) => {
	if (el.previousElementSibling.type === "password") {
		el.previousElementSibling.type = "text";
		el.classList.remove("bi-eye-fill");
		el.classList.add("bi-eye-slash-fill");
	} else {
		el.previousElementSibling.type = "password";
		el.classList.remove("bi-eye-slash-fill");
		el.classList.add("bi-eye-fill");
	}
};