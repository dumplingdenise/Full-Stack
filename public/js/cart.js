const baseURL = "http://localhost:5000/cart";

if (document.getElementById("cart")?.getElementsByTagName("tr").length == 2) {
	document.getElementById("check-cart").classList.add("hidden");
	document.getElementById("cart-empty").classList.remove("hidden");
}

if (document.getElementsByClassName("sold-out")?.length > 0) {
	const checkoutBtn = document.getElementById("checkout-btn");
	checkoutBtn.setAttribute("disabled", true);
	checkoutBtn.classList.add("bg-gray-500", "pointer-events-none");
}

const edit = (id, currVal = 0, cancel = false) => {
	const input = document.getElementById(`input-${id}`);
	const tr = input.parentNode.parentNode;
	const showInEdit = tr.querySelector(".showInEdit");
	const hideInEdit = tr.querySelector(".hideInEdit");

	if (cancel) {
		hideInEdit.classList.remove("hidden");
		showInEdit.classList.add("hidden");

		input.value = currVal;
		input.classList.remove("shadow", "bg-slate-200/50");
		input.setAttribute("disabled", true);
		input.blur();
	} else {
		hideInEdit.classList.add("hidden");
		showInEdit.classList.remove("hidden");

		input.classList.add("shadow", "bg-slate-200/50");
		input.removeAttribute("disabled");
		input.focus();
	}
};

const save = async (id) => {
	try {
		const input = document.getElementById(`input-${id}`);
		const quantity = input.value;

		if (quantity <= 0) return alert("Quantity must be greater than zero.");
		if (!Number.isInteger(parseFloat(quantity))) return alert(`Quantity must be an integer, nearest values are ${Math.floor(quantity / 1)} and ${Math.floor(quantity / 1) + 1}`);
		if (parseInt(quantity) > input.max) return alert(`Event only has ${input.max} tickets left!`);

		const tr = input.parentNode.parentNode;
		const showInEdit = tr.querySelector(".showInEdit");
		const hideInEdit = tr.querySelector(".hideInEdit");

		hideInEdit.classList.remove("hidden");
		showInEdit.classList.add("hidden");

		input.classList.remove("shadow", "bg-slate-200/50");
		input.setAttribute("disabled", true);
		input.blur();

		const res = await axios.put(`${baseURL}/update`, { id, quantity });
		const { success, subtotal, total } = res.data;
		if (!success) return;
		tr.querySelector(".subtotal").innerText = subtotal.toFixed(2);
		document.getElementById("total").innerText = total.toFixed(2);
	} catch ({ message }) {
		console.error({ message });
	}
};

const remove = async (id) => {
	if (!confirm("Are you sure you want to remove this item? (This action is irreversible!)")) return;

	const tr = document.querySelector(`tr[item-id="${id}"]`);
	tr.remove();

	try {
		const res = await axios.delete(`${baseURL}/${id}`);
		const { success, total, empty } = res.data;
		if (!success) return;
		if (empty) {
			document.getElementById("check-cart").classList.add("invisible");
			document.getElementById("cart-empty").classList.remove("invisible");
		} else document.getElementById("total").innerText = total.toFixed(2);
	} catch ({ message }) {
		console.error(message);
	}
};

const clearCart = async () => {
	if (!confirm("Are you sure you want to clear your cart? (This action is irreversible!)")) return;

	try {
		const res = await axios.delete(`${baseURL}`);
		const { success } = res.data;
		if (!success) return;
		document.querySelectorAll("tr[item-id]").forEach((tr) => tr.remove());
		document.getElementById("check-cart").classList.add("invisible");
		document.getElementById("cart-empty").classList.remove("invisible");
	} catch ({ message }) {
		console.error(message);
	}
};

const checkout = async () => {
	const code = document.querySelector("input[name='coupon']")?.value;

	try {
		const res = await axios.post(`${baseURL}/checkout`, { code });
		const { success, url, message } = res.data;
		if (success) return (window.location = url);
		alert(message);
	} catch ({ message }) {
		console.error(message);
	}
};

const returnToCheckout = async () => {
	try {
		const res = await axios(`${baseURL}/return-to-checkout${window.location.search}`);
		const { url } = res.data;
		window.location = url;
	} catch (err) {
		console.error(err);
	}
};

const checkCode = async (el) => {
	const input = document.querySelector("input[name='coupon']");
	const code = input.value;

	try {
		const res = await axios.post(`http://localhost:5000/reward/check`, { code });
		const { valid } = res.data;
		if (!valid) return alert("Invalid code, please recheck your username.");

		alert("Code is valid!");
		input.classList.add("bg-gray-100");
		input.setAttribute("readonly", true);
		el.remove();
	} catch ({ message }) {
		console.error(message);
	}
};
