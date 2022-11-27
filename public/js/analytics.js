const events = JSON.parse(document.getElementById("events").innerText);
const ticketsSold = JSON.parse(document.getElementById("ticketsSold").innerText);

const hiddenSpans = document.querySelectorAll("span.hidden");

if (events.length == 0) {
	hiddenSpans.forEach((span) => span.classList.remove("hidden"));
	document.getElementById("bar").parentElement.classList.add("bg-gray-200");
	document.getElementById("line").parentElement.classList.add("bg-gray-200");
}

let delayed;

const lineData = {
	labels: ticketsSold.map((obj) => obj.date),
	datasets: [
		{
			data: ticketsSold.map((obj) => obj.sold)
		}
	]
};

const lineConfig = {
	type: "line",
	data: lineData,
	options: {
		animation: {
			onComplete: () => {
				delayed = true;
			},
			delay: (context) => {
				let delay = 0;
				if (context.type === "data" && context.mode === "default" && !delayed) {
					delay = context.dataIndex * 300 + context.datasetIndex * 100;
				}
				return delay;
			}
		},
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				callbacks: {
					label: function (context) {
						let label = context.dataset.label || "";

						if (label) {
							label += ": ";
						}
						if (context.parsed.y !== null) {
							label += new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(context.parsed.y);
						}
						return label;
					}
				}
			}
		},
		scales: {
			y: {
				min: 0,
				ticks: {
					stepSize: Math.round(ticketsSold.reduce((total, obj) => total + obj.sold, 0) / 10) + 1
				}
			}
		}
	}
};

new Chart(document.getElementById("line"), lineConfig);

const barData = {
	labels: events.map((obj) => obj.name),
	datasets: [
		{
			label: "ew",
			data: events.map((obj) => obj.sold)
		}
	]
};

const barConfig = {
	type: "bar",
	data: barData,
	options: {
		animation: {
			onComplete: () => {
				delayed = true;
			},
			delay: (context) => {
				let delay = 0;
				if (context.type === "data" && context.mode === "default" && !delayed) {
					delay = context.dataIndex * 300 + context.datasetIndex * 100;
				}
				return delay;
			}
		},
		indexAxis: "y",
		plugins: {
			legend: {
				display: false
			}
		},
		scales: {
			x: {
				min: 0,
				ticks: {
					stepSize: Math.round(events.reduce((total, obj) => total + obj.sold, 0) / 10) + 1
				}
			}
		}
	}
};

new Chart(document.getElementById("bar"), barConfig);
