const dateInput = document.querySelectorAll("input[name='redeem_by']");
const today = new Date(new Date().setDate(new Date().getDate() + 1));
for (const input of dateInput) input.min = today.toLocaleDateString().split("/").reverse().join("-");

const removeReward = async (id) => {
	if (!confirm("Are you sure you want to remove this item? (This action is irreversible!)")) return;

	const tr = document.querySelector(`tr[code="${id}"]`);
	tr.remove();

	try {
		const res = await axios.delete(`http://localhost:5000/reward/${id}`);
		const { success, message } = res.data;
		if (!success) return alert(message);
	} catch ({ message }) {
		console.error(message);
	}
};
