const addToCart = async () => {
	const form = document.querySelector("#ask-quantity form");

	const eventId = form.querySelector("input[name='eventId']").value;
	const quantity = form.querySelector("input[name='quantity']").value;
	const timeslot = form.querySelector("select[name='timeslot']").value;

	if (timeslot === "invalid") return alert("Please select a timeslot.");
	if (quantity < 0) return alert("Quantity must be greater than zero.");
	if (!Number.isInteger(parseFloat(quantity))) return alert(`Quantity must be an integer, nearest values are ${Math.floor(quantity / 1)} and ${Math.floor(quantity / 1) + 1}`);
	const input = form.querySelector("input[name='quantity']");
	if (parseInt(quantity) > input.max) return alert(`Event only has ${input.max} tickets left!`);

	try {
		const res = await axios.post("http://localhost:5000/cart/add", { eventId, quantity, timeslot });
		const { success } = res.data;
		if (success) return (window.location.href = "/user");
		alert("There was a problem with booking, please try again.");
	} catch ({ message }) {
		console.error(message);
	}
};
