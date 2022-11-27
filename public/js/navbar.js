const a = document.getElementById("button");
const authCookie = document.cookie.match(new RegExp("(^| )auth=([^;]+)"));

if (authCookie !== null) {
	a.innerText = "Logout";
	document.querySelectorAll(".hidden").forEach((h) => h.classList.remove("hidden"));
}

const handleClick = async (text) => {
	if (text === "Logout") {
		window.localStorage.removeItem("userId");
		window.localStorage.removeItem("email");
		window.localStorage.removeItem("name");
		document.cookie = "auth=; Max-Age=0;";
		document.cookie = "token=; Max-Age=0;";
		window.location.href = "/logout";
	}
};
