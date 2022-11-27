$.get("/admin/stats_data", (data) => {
	console.log(data);
	if (data.success) {
		const ctx = document.getElementById("chat-myChart");
		const myChart = new Chart(ctx, {
			type: "doughnut",
			data: {
				labels: ["Unresolved", "Resolved"],
				datasets: [
					{
						label: "Total Cases",
						data: [data.total - data.totalResolved, data.totalResolved],
						backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(75, 192, 192, 0.2)"],
						hoverOffset: 4
					}
				]
			}
		});
	} else {
		$(".hidden").removeClass("hidden");
	}
});
