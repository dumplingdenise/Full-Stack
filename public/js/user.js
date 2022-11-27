const deleteAccount = async (event) => {
	event.preventDefault();
	if (!confirm("Delete account? All your data will be lost!")) return;

	try {
		const res = await axios.delete("http://localhost:5000/user");
		const { success, message } = res.data;
		if (success) return (window.location.href = "/");
		alert(message);
	} catch ({ message }) {
		console.error(message);
	}
};
