var socket = io(document.location.host);
// ADMIN CHAT SIDE
let getCookieValue = (name) => document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")?.pop() || "";
var adminId = getCookieValue("auth");
let onlineUsers = [];
let allCurrentMessage = [];
var myInbox = []; // only registered users are loaded upon page load
let receiverId = "";
let arrivalMessage = "";
let activeInbox = "";

// if admin and admin is logged in
$(document).ready(() => {
	socket.emit("joinUser", { userId: adminId, name: null, email: null, isAnon: false }, ({ success }) => {
		if (success) {
			$.get("/admin/admin-inbox", ({ inboxes }) => {
				console.log(myInbox);
				if (inboxes.length > 0) {
					myInbox = [...inboxes];
				}
				$(".conversation-area").append(renderInbox());
				myInbox.forEach((inbox) => {
					if (inbox != undefined) {
						let foundUser = onlineUsers.find((x) => x.userId == inbox.senderId && x.isOnline == true);
						if (foundUser != undefined) {
							$(`#inbox-${inbox.id}`).addClass("online");
						}
					}
				});
			});
		} else {
			Snackbar.show({ text: "Error Connecting To Server.", pos: "top-center" });
		}
	});
	console.log(myInbox);
});

socket.on("getUsers", (users) => {
	//this users contains anonymous user too. So need to save to onlineUsers variable
	console.log(users);
	onlineUsers = [...users];
	$(".online").removeClass("online");
	myInbox.forEach((inbox) => {
		if (inbox != undefined) {
			let foundUser = onlineUsers.find((x) => x.userId == inbox.senderId && x.isOnline == true);
			if (foundUser != undefined) {
				$(`#inbox-${inbox.id}`).addClass("online");
			}
			// this removes when they disconnect.But if they go different page, might not be good. So add a end chat button for user, or mark resolve for admin.
			// else if(foundUser== undefined && inbox.isAnon ==1){
			// 	$(`#inbox-${inbox.id}`).remove();
			// }
		}
	});
});

$("#chat-input-admin").on("keypress", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		sendChatAdmin();
	}
});
function sendChatAdmin(url = null, type = "text") {
	console.log(myInbox);
	let message = !url ? $("#chat-input-admin").val() : url;
	let msgDate = new Date().toISOString();
	console.log(receiverId);
	const foundInboxIndex = myInbox.findIndex((x) => x.senderId == receiverId);
	let thisInbox = myInbox[foundInboxIndex];
	socket.emit("sendMessage", { senderId: adminId, receiverId, msg: message, msgDate, type }, ({ success, msg }) => {
		if (!success) {
			Snackbar.show({ text: "Message Send Failure, Try Again.", pos: "top-center" });
		} else {
			allCurrentMessage.push(msg);
			thisInbox.lastMsgReceived = message; //set so when we shift the boxes below it will be correct
			thisInbox.lastMsgReceivedDate = msgDate;
			$("#chat-input-admin").val("");
			//update your message
			$("#chat-area-main").append(
				`
				<div class="chat-msg owner">
					<div class="chat-msg-profile">
						<div class="chat-msg-date">${moment(msgDate).format("DD/MM h:mm")}</div>
					</div>
					<div class="chat-msg-content" id="msg-${msg.id}">
						${
							msg.file == "image"
								? `
							<div class="lightbox-target" id="pic-${msg.id}">
								<img src="${url}"/>
								<a class="lightbox-close" href="#"></a>
							</div>
						
							<div class="chat-msg-text">
								<a class="lightbox" href="#pic-${msg.id}">
									<img src="${url}">
								</a>
						`
						:
						`
						<div class="chat-msg-text">${msg.msg}
						`
						}
						${
							!thisInbox.isAnon
								? `
							<span class="chatbox-options"  onclick="deleteMessage(${msg.id})">
								<svg fill="currentColor" class="trash-can-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400zM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400zM317.5 24.94L354.2 80H424C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94H317.5zM151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1C174.5 48 171.1 49.34 170.5 51.56L151.5 80zM80 432C80 449.7 94.33 464 112 464H336C353.7 464 368 449.7 368 432V128H80V432z"/></svg>
							</span>
							`:
							``}
						</div>
					</div>
				</div>
				`
			);
			var height = document.getElementById("chat-area-main").lastElementChild.offsetTop;
			$(".chat-area")[0].scrollTo({ top: height, behavior: "smooth" });
			$(`#inbox-${thisInbox["id"]}  .msg-detail .msg-content`)
				.empty()
				.append(
					`
				<span class="msg-message">
					${msg == null ? `<i>Message is Deleted</i>` : msg == "" ? `<i>No Message Yet</i>` : type == "image" ? "<i>Image</i>" : msg.msg}
				</span>
				`
				);
			$(`#inbox-${thisInbox["id"]}`)
				.find(".msg-date")
				.empty()
				.append(`${moment(new Date().toISOString()).format("DD/MM h:mm")}`);
			if (foundInboxIndex != 0) {
				myInbox.splice(foundInboxIndex, 1);
				myInbox.splice(0, 0, thisInbox);
				$(".conversation-area").empty().append(renderInbox());
			}
		}
	});
	//post message to database
}

function openChat(inboxId) {
	console.log(inboxId);
	$(`#inbox-${inboxId}`).addClass("active");

	if (activeInbox != inboxId) {
		$(`#inbox-${activeInbox}`).removeClass("active");
	}

	//send get request to retrieve chat
	$.get(`/admin/inbox/${inboxId}`).then(function (data) {
		if (data.success) {
			//successfully retrieve chat
			//set current chat
			activeInbox = inboxId;

			//render chat in chat area
			let { inboxDetails, chats } = data;

			//set receiverId to emit msg to correct receiver
			let inboxIndex = myInbox.findIndex((x) => x.id == inboxId);
			if (inboxDetails == 1) {
				// equal 1 means anon user and inbox details is in variable myInbox
				inboxDetails = myInbox[inboxIndex];
				// set unseenNumber to 0
				inboxDetails.unseenNumber = 0;
			}

			//re-set our inbox to updated ones
			myInbox[inboxIndex] = inboxDetails;
			receiverId = inboxDetails.senderId; //the inbox sender is our receiver when we send msg

			allCurrentMessage = [...chats];
			$("#chat-area-header").removeClass("hide");
			$("#chat-area-header").empty().append(`
			<div class="chat-area-header-left">
				<img class="chat-msg-img" src=${inboxDetails?.profilePic ? inboxDetails.profilePic : "/images/avatar/Anon_User_Icon.png"} />
			</div>
			<div class="chat-area-header-right ms-4">
				<div class="chat-area-title">${inboxDetails.name}</div>
				<div class="detail-subtitle">${inboxDetails.email}</div>
				${
					inboxDetails.isResolved == 1
						? '<div class="detail-subtitle trash-can-chat"> <span> Status: <i class="fa-solid fa-circle fa-sm ms-2" style="color:green;"></i> </span>'
						: '<div class="detail-subtitle trash-can-chat"> <span> Status: <i class="fa-solid fa-circle fa-sm ms-2" style="color:red;"></i> </span>'
				}
				${
					!inboxDetails.isAnon
						? `<svg fill="currentColor" class="trash-can-icon" id="trash-message-${inboxDetails.id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400zM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400zM317.5 24.94L354.2 80H424C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94H317.5zM151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1C174.5 48 171.1 49.34 170.5 51.56L151.5 80zM80 432C80 449.7 94.33 464 112 464H336C353.7 464 368 449.7 368 432V128H80V432z"/></svg>`
						: ""
				}
				</div>
			<div>
			`);
			if (!inboxDetails.isAnon) {
				document.getElementById("trash-message-" + inboxDetails.id).addEventListener("click", () => {
					let myModal = new bootstrap.Modal(document.getElementById("delete-chat"));
					myModal.show();
					document.getElementById("delete-reg-chat").addEventListener("click", () => deleteRegChat(inboxDetails.id, inboxIndex, myModal));
				});
			}
			if (inboxDetails.isAnon) {
				document.getElementById("chat-files-btn2").style.display = "none";
			}
			let allChats = "";
			chats.map((ele) => {
				allChats += `
					<div class="chat-msg ${adminId == ele.senderId ? "owner" : ""}">
						<div class="chat-msg-profile">
							<div class="chat-msg-date">${moment(ele.msgDate).format("DD/MM h:mm")}</div>
						</div>
						<div class="chat-msg-content" id="msg-${ele.id}">
							${
								ele.file == "image"
									? `
								${
									ele.msg
										? `
								<div class="lightbox-target" id="pic-${ele.id}">
									<img src="${ele.msg}"/>
									<a class="lightbox-close" href="#"></a>
								</div>
								<div class="chat-msg-text">
									<a class="lightbox" href="#pic-${ele.id}">
										<img src="${ele.msg}">
									</a>
								`
										: `
									<div class="chat-msg-text"><i>Message is Deleted</i></div>
								`
								}
									<span class="chatbox-options" onclick="deleteMessage(${ele.id})>
										<svg fill="currentColor" class="trash-can-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400zM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400zM317.5 24.94L354.2 80H424C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94H317.5zM151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1C174.5 48 171.1 49.34 170.5 51.56L151.5 80zM80 432C80 449.7 94.33 464 112 464H336C353.7 464 368 449.7 368 432V128H80V432z"/></svg>
									</span>
							`
									: `
							<div class="chat-msg-text">${ele.msg ? ele.msg : "<i>Message is Deleted</i>"}
							`
							}
							${
								adminId == ele.senderId && !inboxDetails.isAnon
									? `
								<span class="chatbox-options" onclick="deleteMessage(${ele.id})">
									<svg fill="currentColor" class="trash-can-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400zM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400zM317.5 24.94L354.2 80H424C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94H317.5zM151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1C174.5 48 171.1 49.34 170.5 51.56L151.5 80zM80 432C80 449.7 94.33 464 112 464H336C353.7 464 368 449.7 368 432V128H80V432z"/></svg>
								</span>
								`
									: ""
							}
							</div>
						</div>
					</div>
					`
			});

			$("#chat-area-main").empty().append(allChats);
			$(".chat-area-footer").removeClass("hide");
			$("#resolved-checked")
				.empty()
				.append(
					inboxDetails.isResolved == 1
						? `
				<svg id="button-resolved" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
					<path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM371.8 211.8C382.7 200.9 382.7 183.1 371.8 172.2C360.9 161.3 343.1 161.3 332.2 172.2L224 280.4L179.8 236.2C168.9 225.3 151.1 225.3 140.2 236.2C129.3 247.1 129.3 264.9 140.2 275.8L204.2 339.8C215.1 350.7 232.9 350.7 243.8 339.8L371.8 211.8z"/>
				</svg>`
						: `
				<svg id="button-resolved" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
					<path d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/>
				</svg>
			`
				);
			document.getElementById("button-resolved").addEventListener("click", () => resolvedIssue(inboxDetails["id"]));
			$("#resolved-check");
			// as we opened chat, unseenNumber now 0, so remove bubble icon.
			$(`#inbox-${inboxDetails["id"]}`).children().last().empty();
			var height = document.getElementById("chat-area-main").lastElementChild?.offsetTop;
			if (height) {
				$(".chat-area")[0].scrollTo({ top: height, behavior: "smooth" });
			}
			// add the function to click resolve
			// $("body").on("click","#button-resolved",()=>resolvedIssue(inboxDetails.id));
			// $("#send-sendChatAdmin").off("click").on("click",()=>sendChatAdmin());
		} else {
			Snackbar.show({ text: data.message, pos: "bottom-right" });
		}
	});
}

function deleteRegChat(inboxId, inboxIndex, myModal) {
	$.ajax("/admin/inbox/" + inboxId, { type: "DELETE" }).then(({ success, message }) => {
		myModal.hide();
		if (!success) {
			Snackbar.show({ text: message, pos: "top-center" });
			return;
		}
		socket.emit("deleted", { userId: myInbox[inboxIndex]["senderId"] });
		console.log("deleting");
		myInbox.splice([inboxIndex], 1);
		$(".conversation-area").empty().append(renderInbox());
		$("#chat-area-main").empty();
		$("#chat-area-footer").addClass("hide");
		$("#chat-area-header").addClass("hide");
		Snackbar.show({ text: message, pos: "top-center" });
	});
}

function resolvedIssue(inboxId) {
	console.log("resolvedIssue " + inboxId);
	// show modal for anonymous chat
	let foundInbox = myInbox.find((x) => x.id == inboxId);

	if (foundInbox.isAnon == 1) {
		let myModal = new bootstrap.Modal(document.getElementById("resolve-anonymous-chat"));
		myModal.show();
		$("#delete-anonymous-chat")
			.off("click")
			.on("click", () => {
				postResolve(inboxId);
			});
	} else {
		postResolve(inboxId);
	}
}

function postResolve(inboxId) {
	$.post("/chats/resolve/", { inboxId }, ({ success, inboxDetails, message }) => {
		let inboxIndex = myInbox.findIndex((x) => x.id == inboxDetails.id);
		if (success) {
			console.log("/chats/resolve/ " + myInbox[inboxIndex].isAnon);
			if (myInbox[inboxIndex].isAnon == 1) {
				// anon user
				console.log("deleting");
				socket.emit("resolve", { anonInboxId: myInbox[inboxIndex]["id"] });
				myInbox.splice([inboxIndex], 1);
				$(".conversation-area").empty().append(renderInbox());
				$("#chat-area-main").empty();
				$("#chat-area-footer").addClass("hide");
				$("#chat-area-header").addClass("hide");
			} else {
				// reg user
				myInbox[inboxIndex] = inboxDetails;
				$("#resolved-checked")
					.empty()
					.append(
						inboxDetails.isResolved == 1
							? `
					<svg id="button-resolved" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
						<path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM371.8 211.8C382.7 200.9 382.7 183.1 371.8 172.2C360.9 161.3 343.1 161.3 332.2 172.2L224 280.4L179.8 236.2C168.9 225.3 151.1 225.3 140.2 236.2C129.3 247.1 129.3 264.9 140.2 275.8L204.2 339.8C215.1 350.7 232.9 350.7 243.8 339.8L371.8 211.8z"/>
					</svg>
					`
							: `
					<svg id="button-resolved" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512">
						<path d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"/>
					</svg>
				`
					);
				document.getElementById("button-resolved").addEventListener("click", () => resolvedIssue(inboxDetails["id"]));
				$(`#inbox-${inboxDetails.id} .detail-subtitle`)
					.empty()
					.append(
						`
					<div class="detail-subtitle">Status: <i class="bi bi-circle-fill ms-2" style="color: ${inboxDetails.isResolved == 1 ? "green" : "red"};"></i></div>
				`
            );
          $(".chat-area-header-right div:nth-child(3)")
            .empty()
            .append(
              `<div class="detail-subtitle">Status: 
								<i class="bi bi-circle-fill ms-2" style="color: ${inboxDetails.isResolved == 1 ? "green" : "red"}"></i>
							</div>
							${!inboxDetails.isAnon
							? `<svg fill="currentColor" class="trash-can-icon" id="trash-message-${inboxDetails.id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400zM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400zM317.5 24.94L354.2 80H424C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94H317.5zM151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1C174.5 48 171.1 49.34 170.5 51.56L151.5 80zM80 432C80 449.7 94.33 464 112 464H336C353.7 464 368 449.7 368 432V128H80V432z"/></svg>`
							: ""}
							`
            );
        }
      } else {
        Snackbar.show({ text: message, pos: "top-center" });
      }
    }
  );
}

function renderInbox() {
	let appendInbox = "";
	myInbox.map((ele) => {
		let userOnline = onlineUsers.find((x) => x.userId == ele.senderId && x.isOnline == true);
		appendInbox += `
		<div id="inbox-${ele.id}" class="msg ${ele.id == activeInbox ? "active" : ""} ${userOnline != undefined ? "online" : ""}" onclick="openChat(${ele.id})">
			<img class="msg-profile" src=${ele.profilePic != null ? ele.profilePic : "/images/avatar/Anon_User_Icon.png"} alt="" />
			<div class="msg-detail">
				<div class="msg-username">${ele.name}</div>
				<div class="detail-subtitle">Status: <i class="bi bi-circle-fill ms-2" style="color: ${ele.isResolved == 1 ? "green" : "red"};"></i></div>
				<div class="msg-content">
					<span class="msg-message">
						${ele.lastMsgReceived == null ? `<i>Message is Deleted</i>` : ele.lastMsgReceived == "" ? `<i>No Message Yet</i>` : ele.lastMsgReceived.slice(0, 7) == "\\chats\\" ? "<i>Image</i>" : ele.lastMsgReceived}
					</span>
				</div>
				<span class="msg-date">${ele.lastMsgReceivedDate != null ? moment(ele.lastMsgReceivedDate).format("DD/MM h:mm") : ""}</span>
			</div>
			<div>
				${
					ele.unseenNumber > 0
						? `
				<span class="fa-stack small">
					<span class="fa-solid fa-comment fa-stack-2x"></span>
					<strong class="fa-stack fa-stack-1x" style="color: white;">
							${ele.unseenNumber}
					</strong>
				</span>`
						: ""
				}
			</div>
		</div>
		`;
		$("body").on("click", `#inbox-${ele.id}`, () => openChat(ele.id));
	});
	return appendInbox;
}

socket.on("receiveMessage", (chat) => {
	//save the message in memory so 1 fetch to db is enuf
	console.log(myInbox);
	allCurrentMessage.push(chat);
	// check if arrived message belongs to current inbox
	const { id, msg, senderId, msgDate, realInboxId, type } = chat;
	let foundInboxIndex = myInbox.findIndex((x) => x.senderId == senderId);

	let thisInbox = foundInboxIndex != -1 ? myInbox[foundInboxIndex] : "";
	let ifNew = false; // for new anon inbox to have its inbox appended during the swapping of inboxes
	if (thisInbox != "" && receiverId == senderId) {
		// if receiverId (current active user) means the message belongs to active inbox
		$("#chat-area-main").append(
			`
			<div class="chat-msg">
				<div class="chat-msg-profile">
					<div class="chat-msg-date">${moment(msgDate).format("DD/MM h:mm")}</div>
				</div>
				<div class="chat-msg-content" id="msg-${id}">
				${
					type == "image"
						? `
				<div class="lightbox-target" id="pic-${id}">
					<img src="${msg}"/>
					<a class="lightbox-close" href="#"></a>
				</div>
				<div class="chat-msg-text">
					<a class="lightbox" href="#pic-${id}">
						<img src="${msg}">
					</a>
				`
						: `
				<div class="chat-msg-text">${msg}</div>
				`
				}
				</div>
			</div>
			`
		);
		var height = document.getElementById("chat-area-main").lastElementChild.offsetTop;
		$(".chat-area")[0].scrollTo({ top: height, behavior: "smooth" });

		$(`#inbox-${thisInbox["id"]}  .msg-detail .msg-content`)
			.empty()
			.append(
				`
			<span class="msg-message">
				${msg == null ? `<i>Message is Deleted</i>` : msg == "" ? `<i>No Message Yet</i>` : type == "image" ? "<i>Image</i>" : msg}
			</span>
			`
			);
		$(`#inbox-${thisInbox["id"]}`)
			.find(".msg-date")
			.empty()
			.append(`${moment(new Date().toISOString()).format("DD/MM h:mm")}`);
	} else {
		// the message doesnt belong to current active inbox
		console.log(myInbox, foundInboxIndex, senderId);
		if (foundInboxIndex != -1) {
			// if message belongs to one of the inbox users.
			thisInbox["lastMsgReceived"] = msg;
			thisInbox["lastMsgReceivedDate"] = msgDate;

			$(`#inbox-${thisInbox["id"]}  .msg-detail .msg-content`)
				.empty()
				.append(
					`
				<div class="msg-content">
					<span class="msg-message">
						${msg == null ? `<i>Message is Deleted</i>` : msg == "" ? `<i>No Message Yet</i>` : type == "image" ? "<i>Image</i>" : msg}
					</span>
				</div>
				`
				);
			$(`#inbox-${thisInbox["id"]}`)
				.find(".msg-date")
				.empty()
				.append(`${moment(new Date().toISOString()).format("DD/MM h:mm")}`);
			$(`#inbox-${thisInbox["id"]}`)
				.children()
				.last()
				.empty()
				.append(
					`
				<span class="fa-stack small">
					<span class="fa-solid fa-comment fa-stack-2x"></span>
					<strong class="fa-stack fa-stack-1x" style="color: white;">
							${(thisInbox["unseenNumber"] += 1)}
					</strong>
				</span>
				`
				);
		} else {
			// new message doesnt belong to any of the inbox users, can be anonymous user or reg user. So we update the myInbox first.
			// get the anon/reg user from our onlineUsers
			let foundUser = onlineUsers.find((x) => x.userId == senderId);
			let newInboxItem;
			if (foundUser.anonInboxId != "") {
				// set myInbox to include the anon users stuff
				newInboxItem = {
					isResolved: 0,
					unseenNumber: 1,
					lastMsgReceived: msg,
					lastMsgReceivedDate: msgDate,
					profilePic: "/images/avatar/Anon_User_Icon.png",
					ownerId: adminId,
					senderId: senderId,
					id: foundUser["anonInboxId"],
					name: foundUser["name"],
					email: foundUser["email"],
					isAdmin: 0,
					isAnon: 1
				};
			} else {
				// reg users
				newInboxItem = {
					isResolved: 0,
					unseenNumber: 1,
					lastMsgReceived: msg,
					lastMsgReceivedDate: msgDate,
					profilePic: "/images/avatar/Reg_User_Icon.png",
					ownerId: adminId,
					senderId: senderId,
					id: realInboxId,
					name: foundUser["name"],
					email: foundUser["email"],
					isAdmin: 0,
					isAnon: 0
				};
			}
			myInbox.push({
				newInboxItem
			});

			foundInboxIndex = myInbox.length - 1; //set to new length because this newInbox is added right at the end of myinbox
			thisInbox = newInboxItem;
			ifNew = true;
		}
		// shift the most recent messages to the top
		if (foundInboxIndex != 0 || ifNew) {
			myInbox.splice(foundInboxIndex, 1);
			myInbox.splice(0, 0, thisInbox);

			$(".conversation-area").empty().append(renderInbox());
		}
	}
});

// delete a particular message
function deleteMessage(id) {
	let myModal = new bootstrap.Modal(document.getElementById("delete-message"));
	myModal.show();
	$("#delete-msg-chat").click(() => performDelete(id, myModal));
}
function performDelete(id, myModal) {
	console.log(id);
	$.ajax("/chats/message/" + id, { type: "DELETE" }).then(({ success, message }) => {
		myModal.hide();
		if (!success) {
			Snackbar.show({ text: message, pos: "top-center" });
			return;
		}
		let inboxIndex = myInbox.findIndex((x) => x.id == activeInbox);
		socket.emit("deletedMsg", { userId: myInbox[inboxIndex]["senderId"], msgId: id });
		var messageDeleteIndex = allCurrentMessage.findIndex((msg) => msg.id == id);
		allCurrentMessage[messageDeleteIndex]["msg"] = null;
		
		$(`#msg-${id} .chat-msg-text`).addClass("message-deleted").text("Message is Deleted");
		
		Snackbar.show({ text: message, pos: "top-center" });
		if (messageDeleteIndex == allCurrentMessage.length-1){
			$(`#inbox-${activeInbox}  .msg-detail .msg-content`)
				.empty()
				.append(
					`
				<span class="msg-message message-deleted">Message is Deleted</span>
				`
			);
		}
	});
}
socket.on("messageDeletedAck", ({ msgId }) => {
	console.log(msgId);
	var messageDeleteIndex = allCurrentMessage.findIndex((msg) => msg.id == msgId);
	allCurrentMessage[messageDeleteIndex]["msg"] = null;
	$(`#msg-${msgId} .chat-msg-text`).addClass("message-deleted").text("Message is Deleted");
	if (messageDeleteIndex == allCurrentMessage.length-1){
		$(`#inbox-${activeInbox}  .msg-detail .msg-content`)
			.empty()
			.append(
				`
			<span class="msg-message message-deleted">Message is Deleted</span>
			`
			);
	}
});
// isResolved. Remove anonymous chats. But saved to db for reg users.

document.getElementById("chat-files-btn2").onclick = () => {
	document.getElementById("chat-files2").click();
};

$("input[type=file]").change(function (e) {
	var formData = new FormData();
	formData.append("chat-files", e.target.files[0]);
	$.ajax({
		url: "/chats/image",
		data: formData,
		cache: false,
		contentType: false,
		processData: false,
		method: "POST",
		type: "POST", // For jQuery < 1.9
		success: function (data) {
			if (!data.success) {
				return Snackbar.show({ text: data.err.message, pos: "top-center" });
			} else {
				console.log(data);
				sendChatAdmin(data.url, "image");
			}
		}
	});
});
