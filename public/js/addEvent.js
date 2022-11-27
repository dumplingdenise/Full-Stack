const startTimes = document.querySelectorAll("input[name='startTime']");
for (const input of startTimes) input.value = input.min = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 16);

const handleKeyUp = (el) => {
	if ([",", " "].includes(el.value.slice(-1))) {
		if (el.value !== " " && el.value !== ",") {
			document.querySelector("#categories").innerHTML += `
			<text class="bg-red-500 cursor-pointer text-white text-sm ml-2 px-2 py-1 rounded hover:shadow" onclick="this.remove()" > ${el.value.slice(0, -1)} </text>
			`;
		}

		el.value = "";
	}
};

const addTimeSlot = () => {
	document.querySelector("#timeslots").innerHTML += `
		<span class="flex items-end justify-between space-x-4">
			<input type="datetime-local" name="startTime" class="start-time peer w-1/3 mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-600" required />
			<input type="datetime-local" name="endTime" class="end-time peer w-1/3 mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-600" required />
			<input type="text" name="venue" class="venue peer w-1/3 mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-600" required />
			<i onclick="this.parentElement.remove()" class="bi-dash h-fit cursor-pointer rounded-md bg-sky-800 px-2 py-1 text-2xl text-white duration-700 ease-out hover:bg-sky-600"></i>
		</span>
	`;
};

const addEvent = async (el) => {
	const inputs = el.getElementsByTagName("input");
	const name = inputs[0].value;
	const ticketCount = inputs[1].value;
	const ticketPrice = inputs[2].value;
	const synopsis = el.querySelector("textarea").value;

	let categoriesArray = [];
	const categories = el.querySelector("#categories").getElementsByTagName("text");
	for (const cat in categories) categoriesArray.push(categories[cat].innerText);
	categoriesArray = categoriesArray.slice(0, -3);

	let timeslots = [];
	const startTimes = el.getElementsByClassName("start-time");
	const endTimes = el.getElementsByClassName("end-time");
	const venues = el.getElementsByClassName("venue");
	for (const i in startTimes) timeslots.push({ startTime: startTimes[i].value, endTime: endTimes[i].value, venue: venues[i].value });

	const body = { name, ticketCount, ticketPrice, synopsis, categories: categoriesArray.map((cat) => cat.toLowerCase()).join(), timeslots: JSON.stringify(timeslots.slice(0, -3)) };

	try {
		await axios.post("http://localhost:5000/event", body);
		window.location.href = "/user";
	} catch (error) {
		console.error(error);
	}
};
