if (window.location.pathname == "/admin") for (const i of document.querySelectorAll(".bi-pencil-square :not(tr[code] i)")) i.classList.add("hidden");
if (document.getElementById("events").getElementsByTagName("tr").length == 2) document.getElementById("events-empty").classList.remove("hidden");

const isPostponed = document.querySelectorAll("span.postponed-true");
for (const postponed of isPostponed) postponed.classList.add("text-red-400");
const notPostponed = document.querySelectorAll("span.postponed-false");
for (const not of notPostponed) not.classList.add("text-green-500");

const deleteEvent = async (id) => {
	if (!confirm("Are you sure you want to delete this event? This action is irreversible!")) return;
	try {
		document.querySelectorAll(`tr[event-id="${id}"]`).forEach((tr) => tr.remove());
		const res = await axios.delete(`http://localhost:5000/event/${id}`);
		const { success, empty } = res.data;
		if (success && empty) document.getElementById("events-empty").classList.remove("hidden");
	} catch (error) {
		console.error(error);
	}
};

const postponeEvent = async (id) => {
	const span = document.querySelector(`tr[event-id='${id}']>td:nth-child(5)>span`);

	if (span.innerText === "false") {
		span.innerText = "true";
		span.classList.add("text-red-400");
		span.classList.remove("text-green-500");
	} else {
		span.innerText = "false";
		span.classList.add("text-green-500");
		span.classList.remove("text-red-400");
	}

	try {
		await axios.patch(`http://localhost:5000/event/${id}`, { postponed: span.innerText === "true" });
	} catch ({ message }) {
		console.error(message);
	}
};
