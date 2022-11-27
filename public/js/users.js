document.querySelectorAll(`tr[user-id='${authCookie[2]}'] td:last-child span`).forEach((i) => i.remove());

const isAdmins = document.querySelectorAll("span.admin-true");
for (const admin of isAdmins) admin.classList.add("text-green-500");
const notAdmins = document.querySelectorAll("span.admin-false");
for (const notAdmin of notAdmins) notAdmin.classList.add("text-red-400");

const isBanned = document.querySelectorAll("span.banned-true");
for (const ban of isBanned) ban.classList.add("text-red-400");
const notBanned = document.querySelectorAll("span.banned-false");
for (const notBan of notBanned) notBan.classList.add("text-green-500");

const toggleAdmin = async (id) => {
	const span = document.querySelector(`tr[user-id='${id}']>td:nth-child(6)>span`);

	if (span.innerText === "false") {
		span.innerText = "true";
		span.classList.remove("text-red-400");
		span.classList.add("text-green-500");
	} else {
		span.innerText = "false";
		span.classList.remove("text-green-500");
		span.classList.add("text-red-400");
	}

	try {
		await axios.put(`http://localhost:5000/admin/${id}`, { isAdmin: span.innerText === "true" });
	} catch ({ message }) {
		console.error(message);
	}
};

const toggleBan = async (id) => {
	const span = document.querySelector(`tr[user-id='${id}']>td:nth-child(7)>span`);

	if (span.innerText === "false") {
		span.innerText = "true";
		span.classList.remove("text-green-500");
		span.classList.add("text-red-400");
	} else {
		span.innerText = "false";
		span.classList.remove("text-red-400");
		span.classList.add("text-green-500");
	}

	try {
		await axios.put(`http://localhost:5000/admin/${id}`, { banned: span.innerText === "true" });
	} catch ({ message }) {
		console.error(message);
	}
};

const deleteUser = async (id) => {
	if (!confirm("Delete this user? This action is irreversible!")) return;

	try {
		document.querySelectorAll(`tr[user-id="${id}"]`).forEach((tr) => tr.remove());
		if (document.getElementById("events").getElementsByTagName("tr").length == 2) document.getElementById("events-empty").classList.remove("hidden");
		await axios.delete(`http://localhost:5000/admin/${id}`);
		window.location.href = "/";
	} catch ({ message }) {
		console.error(message);
	}
};

const deleteReward = async (code) => {
	if (!confirm("Delete this reward? This action is irreversible!")) return;

	try {
		document.querySelector(`tr[code="${code}"]`).remove();
		await axios.delete(`http://localhost:5000/reward/code/${code}`);
	} catch ({ message }) {
		console.error(message);
	}
};
