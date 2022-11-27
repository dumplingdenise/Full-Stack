const categories = document
	.querySelector("input[name='categories']")
	.value.split(",")
	.filter((cat) => cat !== "");
for (const cat of categories)
	document.querySelector("#categories").innerHTML += `
		<text class="bg-red-500 cursor-pointer text-white text-sm ml-2 px-2 py-1 rounded hover:shadow" onclick="this.remove()" >
			${cat}
		</text>
	`;
document.querySelector("input[name='categories']").value = "";

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

const updateEvent = async (el) => {
	const inputs = el.getElementsByTagName("input");
	const name = inputs[0].value;
	const ticketCount = inputs[1].value;
	const ticketPrice = inputs[2].value;
	const synopsis = inputs[3].value;

	let categoriesArray = [];
	const categories = el.querySelector("#categories").getElementsByTagName("text");
	for (const cat in categories) categoriesArray.push(categories[cat].innerText);
	categoriesArray = categoriesArray.slice(0, -3);

	const body = { name, ticketCount, ticketPrice, synopsis, categories: categoriesArray.map((cat) => cat.toLowerCase()).join() };

	try {
		const id = window.location.pathname.split("/")[3];
		const res = await axios.put(`http://localhost:5000/event/${id}`, body);
		const { success } = res.data;
		if (success) window.location.href = "/user";
	} catch (error) {
		console.error(error);
	}
};
