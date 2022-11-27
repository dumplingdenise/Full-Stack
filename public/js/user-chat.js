$(".chatbox-close").click(() => $(".chatbox-popup, .chatbox-close").fadeOut());

$(".chatbox-maximize").click(() => {
	$(".chatbox-popup, .chatbox-open, .chatbox-close").fadeOut();
	$(".chatbox-panel").fadeIn();
	$(".chatbox-panel").css({ display: "flex" });
});

$(".chatbox-minimize").click(() => {
	$(".chatbox-panel").fadeOut();
	$(".chatbox-popup, .chatbox-open, .chatbox-close").fadeIn();
});

$(".chatbox-panel-close").click(() => {
	$(".chatbox-panel").fadeOut();
	$(".chatbox-open").fadeIn();
});

var socket = io(document.location.host);
const chatButton = document.getElementsByClassName("chatbox-open");
// save userId into localStorage
let getCookieValue = (name) => document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")?.pop() || "";

var all_chats = [];
var adminId = -1;
var adminIsOnline = false;
var currentLoggedInUser = getCookieValue("auth") ? getCookieValue("auth") : localStorage.getItem("userId") ? localStorage.getItem("userId") : null;
var currentLoggedInUserName = localStorage.getItem("name");
var currentLoggedInUserEmail = localStorage.getItem("email");

chatButton[0].addEventListener("click", () => {
	$(".chatbox-popup, .chatbox-close").fadeIn();
	// check whos is the logged in user. possible response: success, invalidToken
	getChats();
});

function proceedChat(name, email, message, userId, isAnon = false) {
	// change form to now a chat
	$("#chatbox-popup")
		.empty()
		.append(
			`
		<header id="chatbox-popup__header" class="chatbox-popup__header">
			<aside style="flex:8">${
				!adminIsOnline
					? `<h1 style="letter-spacing:0px;">Customer Support Admin</h1> (Online) <i class="fa-solid fa-circle fa-sm ml-2" style="color:green;"></i>`
					: `<h1 style="letter-spacing:0px;">Customer Support Admin</h1> (Offline) <i class="fa-solid fa-circle fa-sm ml-2" style="color:red;"></i>`
			}
				</aside>
				<aside>
				<button class="chatbox-maximize"><i class="bi bi-window"></i></button>
			</aside>
		</header>
		<main class="chatbox-popup__main">
					
		</main>
		<footer class="chatbox-popup__footer">
				${
					!isAnon
						? `
				<input type="file" id="chat-files" name="chat-files" style="display:none;">
				<button id="chat-files-btn" style="flex:1;color:#888;text-align:center;">
					<i class="bi bi-paperclip"></i>
				</button>
				`
						: ``
				}
			<aside style="flex:10">
				<input id="chat-input" class="chat-input" type="text" placeholder="Type your message here..." autofocus />
			</aside>
			<button id="send-chat-button" onclick="sendChatUser()" style="flex:1;color:#888;text-align:center;">
				<i class="bi bi-send-fill"></i>
			</button>
		</footer>
		`
		);
	if (!isAnon) {
		document.getElementById("chat-files-btn").onclick = () => {
			document.getElementById("chat-files").click();
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
						return Snackbar.show({ text: data.err.message, pos: "bottom-right" });
					} else {
						console.log(data);
						sendChatUser(data.url, "image");
					}
				}
			});
		});
	}
	$("#chat-input").on("keypress", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			sendChatUser(undefined, "text", isAnon ? true : false);
		}
	});
	// route for non-existing and anonymous customer
	socket.emit("joinUser", { userId: userId, name, email, isAnon }, () => {
		sendChatUser(message, "text", true);
	});
}

function sendChatUser(haveMessage, type = "text", isAnon = false) {
	let msg = "";
	let msgDate = "";
	if (haveMessage == undefined) {
		msg = $("#chat-input").val();
	} else {
		msg = haveMessage;
	}
	msgDate = new Date().toISOString();
	socket.emit("sendMessage", { senderId: currentLoggedInUser, receiverId: adminId, msg, msgDate, type }, ({ success, msg: { id } }) => {
		if (!success) {
			Snackbar.show({ text: "Message Send Failure, Try Again.", pos: "bottom-right" });
		} else {
			$("#chat-input").val("");
			//update your message

			$(".chatbox-popup__main").append(
				`
					<div class="chat-msg owner">
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
						<div class="chat-msg-text">${msg}
						`
						}
						${
							!isAnon
								? `
							<span class="chatbox-options" onclick="deleteMessage(${id})">
								<svg fill="currentColor" class="trash-can-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400zM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400zM317.5 24.94L354.2 80H424C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94H317.5zM151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1C174.5 48 171.1 49.34 170.5 51.56L151.5 80zM80 432C80 449.7 94.33 464 112 464H336C353.7 464 368 449.7 368 432V128H80V432z"/></svg>
							</span>
							`
								: ``
						}
						</div>
					</div>
				</div>
					`
			);
			var height = document.getElementsByClassName("chatbox-popup__main")[0].lastElementChild.offsetTop;
			$(".chatbox-popup__main")[0].scrollTo({
				top: height,
				behavior: "smooth"
			});
		}
	});
}

socket.on("getUsers", (users) => {
	console.log(users);
	console.log(adminId);
	updateAdminOnline(users);
});

function updateAdminOnline(users) {
	const foundAdmin = users.find((x) => x.isAdmin == 1);
	console.log("updateAdminOnline " + foundAdmin);
	if (foundAdmin?.isOnline) {
		$("#chatbox-popup__header aside:nth-child(1)")
			.empty()
			.append(
				`
			<h1>Customer Support Admin</h1> (Online) <i class="fa-solid fa-circle fa-sm ml-2" style="color:green;"></i>
			`
			);
		adminIsOnline = true;
		adminId = foundAdmin.userId;
	} else {
		$("#chatbox-popup__header aside:nth-child(1)")
			.empty()
			.append(
				`
			<h1>Customer Support Admin</h1> (Offline)<i class="fa-solid fa-circle fa-sm ml-2" style="color:red;"></i>
			`
			);
		adminIsOnline = false;
	}
}

socket.on("receiveMessage", (message, senderId) => {
	//save the message in memory so 1 fetch to db is enuf
	all_chats.push(message);
	console.log(all_chats);
	$(".chatbox-popup__main").append(
		`
		<div class="chat-msg ${currentLoggedInUser == message.senderId ? "owner" : null}">
		<div class="chat-msg-profile">
			<div class="chat-msg-date">${moment(message.msgDate).format("DD/MM h:mm")}</div>
		</div>
		<div class="chat-msg-content" id="msg-${message.id}">
			${
				message.type == "image"
					? `
			<div class="lightbox-target" id="pic-${message.id}">
				<img src="${message.msg}"/>
				<a class="lightbox-close" href="#"></a>
			</div>
			<div class="chat-msg-text">
				<a class="lightbox" href="#pic-${message.id}">
					<img src="${message.msg}">
				</a>
			`
					: `
			<div class="chat-msg-text">${message.msg}</div>
			`
			}
			
		</div>
	</div>
		`
	);
	var height = document.getElementsByClassName("chatbox-popup__main")[0].lastElementChild.offsetTop;
	$(".chatbox-popup__main")[0].scrollTo({ top: height, behavior: "smooth" });
});

function redirectToLogin() {
	window.location.href = "/login";
}

socket.on("resolveReceived", () => {
	console.log("resolveReceivied");
	getChats();
});
socket.on("messageDeletedAck", ({ msgId }) => {
	console.log(msgId);
	var deletedIndex = all_chats.findIndex((x) => x.id == msgId);
	console.log(deletedIndex);
	all_chats[deletedIndex]["msg"] = null;
	$(`#msg-${msgId} .chat-msg-text`).addClass("message-deleted").text("Message is Deleted");
});

function getChats() {
	$.post("/chats/inbox", { userId: currentLoggedInUser, adminId: adminId }, ({ success, adminId2, chats, isAnon }) => {
		if (success) {
			//user is logged in and receive chats
			//set the adminId
			adminId = adminId2;
			// append chat box html
			$("#chatbox-popup")
				.empty()
				.append(
					`
				<header id="chatbox-popup__header" class="chatbox-popup__header">
					<aside style="flex:8">
						<h1 style="letter-spacing:0px;">Customer Support Admin</h1> (Offline) <i class="fa-solid fa-circle fa-sm ml-2" style="color:red;"></i>
					</aside>
					<aside >
						<button class="chatbox-maximize"><i class="bi bi-window"></i></button>
					</aside>
				</header>
				<main class="chatbox-popup__main">
					
				</main>
				<footer class="chatbox-popup__footer">
				${
					!isAnon
						? `
				<input type="file" id="chat-files" name="chat-files" style="display:none;">
				<button id="chat-files-btn" style="flex:1;color:#888;text-align:center;">
					<i class="bi bi-paperclip"></i>
				</button>
				`
						: ``
				}
					<aside style="flex:10">
						<input id="chat-input" class="chat-input" type="text" placeholder="Type your message here..." autofocus />
					</aside>
					<button id="send-chat-button" onclick="sendChatUser()" style="flex:1;color:#888;text-align:center;">
						<i class="bi bi-send-fill"></i>
					</button>
				</footer>
				`
				);
			if (!isAnon) {
				document.getElementById("chat-files-btn").onclick = () => {
					document.getElementById("chat-files").click();
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
								return Snackbar.show({ text: data.err.message, pos: "bottom-right" });
							} else {
								console.log(data);
								sendChatUser(data.url, "image");
							}
						}
					});
				});
			}
			$("#chat-input").on("keypress", (event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					sendChatUser();
				}
			});
			// emit join user.
			socket.emit("joinUser", { userId: currentLoggedInUser, name: currentLoggedInUserName, email: currentLoggedInUserEmail, isAnon }, () => {
				//append all chats
				let allChats = "";
				all_chats = [...chats];
				all_chats.map((ele) => {
					allChats += `
					<div class="chat-msg ${currentLoggedInUser == ele.senderId ? "owner" : ""}">
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
								currentLoggedInUser == ele.senderId && !isAnon
									? `
							<span class="chatbox-options" onclick="deleteMessage(${ele.id})">
								<svg fill="currentColor" class="trash-can-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400zM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400zM317.5 24.94L354.2 80H424C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94H317.5zM151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1C174.5 48 171.1 49.34 170.5 51.56L151.5 80zM80 432C80 449.7 94.33 464 112 464H336C353.7 464 368 449.7 368 432V128H80V432z"/></svg>
							</span>`
									: ""
							}
							</div>
						</div>
					</div>
						`;
				});
				$(".chatbox-popup__main").empty().append(allChats);
				var height = document.getElementsByClassName("chatbox-popup__main")[0].lastElementChild?.offsetTop;
				$(".chatbox-popup__main")[0].scrollTo({
					top: height,
					behavior: "smooth"
				});
			});
		} else {
			// user is not logged in
			socket.emit("checkAdminOnline", {}, (users) => {
				// to check if admin online
				console.log(users);
				const foundAdmin = users.find((x) => x.isAdmin == 1);
				if (foundAdmin != undefined) {
					adminIsOnline = true;
					adminId = foundAdmin.userId;
				}
				console.log(adminId);
				$("#chatbox-popup")
					.empty()
					.append(
						`
					<header id="chatbox-popup__header" class="chatbox-popup__header">
						<aside style="flex:8">${
							!adminIsOnline
								? `<h1 style="letter-spacing:0px;">Customer Support Admin</h1> (Offline) <i class="fa-solid fa-circle fa-sm ml-2" style="color:red;"></i>`
								: `<h1 style="letter-spacing:0px;">Customer Support Admin</h1> (Online) <i class="fa-solid fa-circle fa-sm ml-2" style="color:green;"></i>`
						}
							</aside>
							<aside>
							<button class="chatbox-maximize"><i class="bi bi-window"></i></button>
						</aside>
					</header>
					<div class="chatbox-popup__main">
						<form id="start-chat-form">
							<h2 style="font-size:0.8rem; letter-spacing:0px;margin-bottom:4px;">Chats outside business hours for registered members only.</h2>
							<p style="font-size:0.7rem;">Our business hours are 9am-6pm, Mon-Fri.</p>
							
							<label for="email" class="text-sm font-bold text-sky-800">
								Email address
							</label>
							<input type="email" name="email" id="chat-email" autocomplete="off" class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-600" required />
							
							<label for="name" class="text-sm font-bold text-sky-800">
								Name
							</label>
							<input type="text" name="name" id="chat-name" autocomplete="off" class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-600" required />
							
							<label for="message" class="text-sm font-bold text-sky-800">
								Message
							</label>
							<textarea name="message" id="chat-message" rows="4" class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-600" required></textarea>
							<button type="submit" class="custom-btn custom-border-btn btn btn-small ms-auto">Start Chat</button>
						</div>
						<div id="success-state-2" class="success-state"></div>
					</form>`
					);
				$("#start-chat-form").submit((e) => {
					e.preventDefault();
					var email = $("#chat-email").val();
					var name = $("#chat-name").val();
					var message = $("#chat-message").val();
					$.post(
						"/chats/start_chat",
						{
							email,
							message,
							name
						},
						({ success, isExistingCustomer, name, email, message, userId }) => {
							// returns generated userId
							if (success) {
								// route for existing customer
								if (isExistingCustomer) {
									$("#existing-customer-modal .modal-body")
										.empty()
										.append(
											`
												<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
									If yes, please <strong>copy and paste</strong> the message after logging in.<br/>
									Message:<br/>
									<p>
									<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
									${message}
									</p>
									
									`
										);

									var myModal = new Modal(document.getElementById("existing-customer-modal"));
									myModal.show();
									$("#login-now-modal")
										.off("click")
										.on("click", () => {
											redirectToLogin();
										});
									// chat as anonymous customer
									$("#existing-customer-modal-close1")
										.off("click")
										.on("click", () => {
											myModal.hide();
											currentLoggedInUser = userId;
											currentLoggedInUserName = name;
											currentLoggedInUserEmail = email;
											localStorage.setItem("userId", userId);
											localStorage.setItem("name", name);
											localStorage.setItem("email", email);
											proceedChat(name, email, message, userId, true);
										});
									$("#close-now-modal")
										.off("click")
										.on("click", () => {
											myModal.hide();
											if(!adminIsOnline){
												var myModal2 = new Modal(document.getElementById("customer-service-offline"));
												myModal2.show();
												$("#customer-service-offline-close1").on("click", () => {
												myModal2.hide();
												});
												$("#customer-service-offline-close2").on("click", () => {
												myModal2.hide();
												});
												return;
											}
											currentLoggedInUser = userId;
											currentLoggedInUserName = name;
											currentLoggedInUserEmail = email;
											localStorage.setItem("userId", userId);
											localStorage.setItem("name", name);
											localStorage.setItem("email", email);
											proceedChat(name, email, message, userId, true);
										});
								} else {
									// route for anonymous customer
									if (!adminIsOnline) {
										var myModal = new Modal(document.getElementById("customer-service-offline"));
										myModal.show();
										$("#customer-service-offline-close1").on("click", () => {
											myModal.hide();
										});
										$("#customer-service-offline-close2").on("click", () => {
											myModal.hide();
										});
										return;
									}
									currentLoggedInUser = userId;
									currentLoggedInUserName = name;
									currentLoggedInUserEmail = email;
									localStorage.setItem("userId", userId);
									localStorage.setItem("name", name);
									localStorage.setItem("email", email);
									proceedChat(name, email, message, userId, true);
								}
							} else {
								// unsuccessfull meaning empty fields
								Snackbar.show({ text: "Please Fill In All Fields.", pos: "bottom-right" });
							}
						}
					);
				});
			});
		}
	});
}

// delete a particular message
function deleteMessage(id) {
	let myModal = new Modal(document.getElementById("delete-message"));
	myModal.show();
	$("#close-msg-chat").click(() => myModal.hide());
	$("#delete-message-close1").click(() => myModal.hide());
	$("#delete-msg-chat").click(() => performDelete(id, myModal));
}
function performDelete(id, myModal) {
	console.log(id);
	$.ajax("/chats/message/" + id, { type: "DELETE" }).then(({ success, message }) => {
		myModal.hide();
		if (!success) {
			Snackbar.show({ text: message, pos: "bottom-right" });
			return;
		}
		socket.emit("deletedMsg", { userId: adminId, msgId: id });
		$(`#msg-${id} .chat-msg-text`).addClass("message-deleted").text("Message is Deleted");
		Snackbar.show({ text: message, pos: "bottom-right" });
	});
}
