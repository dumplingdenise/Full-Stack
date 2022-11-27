const dateInput = document.querySelector("input[name='redeem_by']");
const today = new Date(new Date().setDate(new Date().getDate() + 1));
dateInput.value = dateInput.min = today.toLocaleDateString().split("/").reverse().join("-");
