const search = () => {
	const search = document.getElementById("search").value;
	const events = [...document.querySelectorAll("#events .hidden")].map((div) => ({ id: div.getAttribute("item-id"), content: div.innerText }));
	const toHide = events.filter((event) => !event.content.includes(search)).map((event) => event.id);
	for (const event of document.querySelectorAll(`a[href^="event/"]`)) event.classList.remove("hidden");
	for (const res of toHide) document.querySelector(`a[href="event/${res}"]`).classList.add("hidden");
};
