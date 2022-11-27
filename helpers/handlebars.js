const parseObject = (object) => JSON.stringify(object);

const formatMoney = (amount) => amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");

const moment = require("moment");
const formatDatetime = (datetime) => moment(datetime.toISOString("-").slice(0, -5)).format("Do MMM YYYY");
const formatDatetimeForInput = (datetime) => moment(datetime.toISOString("-").slice(0, -5)).format("YYYY-MM-DD");
const formatLocaleDateTime = (datetime) => {
	const test = moment(datetime.toISOString("-")).utc().format();
	console.log(test);
	return datetime;
};

const selectCheck = function (value, selectCheck) {
	return value == selectCheck ? "selected" : "";
};

const checkboxCheck = function (value, checkboxValue) {
	return value.search(checkboxValue) >= 0 ? "checked" : "";
};

const radioCheck = function (value, radioValue) {
	return value == radioValue ? "checked" : "";
};

const timeSinceLast = function (lastMsgDate) {
	return moment(lastMsgDate).fromNow();
};

const isChatAdmin = function (senderId, adminId) {
	return senderId == adminId;
};

const checkNull = (string) => string ?? "none";

const formatTags = (tags) =>
	checkNull(tags)
		.split(",")
		.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
		.join(", ");

module.exports = { parseObject, formatMoney, formatDatetime, formatDatetimeForInput, selectCheck, checkboxCheck, radioCheck, timeSinceLast, isChatAdmin, checkNull, formatTags };
