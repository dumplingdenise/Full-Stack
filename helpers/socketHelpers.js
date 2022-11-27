let activeInbox = "";
let users = []; // users With name and email means anonymous. 
let anonChats = {};	
const jwt = require("jsonwebtoken");

function getCookie(value, name) {
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// check if normal token is valid, if not please refresh it with refresh token.
function authenticateToken(req, res, next) {
	if (req.headers.cookie == undefined) {
		res.redirect("/");
	}
	const cookies = `; ${req.headers.cookie}`;
	if (!cookies.includes('token=')){
		return res.json({ success: false, invalidToken: true });
	}
	let normalToken = getCookie(cookies, 'token');
	if (normalToken.length === 2) { normalToken = normalToken.pop().split(';').shift(); }
  console.log(normalToken)
	if (normalToken == null) return res.json({ success: false, invalidToken: true }); //invalid token

	jwt.verify(normalToken, "secret", (err, userId) => {

    if (err) {
      console.log(err)
      return res.json({ success: false, invalidToken: true }) //invalid token
    }
		console.log(userId);
		req.user = userId
		next()
	})
}

const addAnonChats = (inboxId, msg)=>{
  if(anonChats[inboxId]==undefined){ // add new 
    anonChats[inboxId] = {
      unseenNumber: 1,
      msgs: [msg]
    }
  } else { // append to msgs
    anonChats[inboxId]["unseenNumber"] += 1
    anonChats[inboxId]["msgs"].push(msg);
  }
  return msg
};
const resetAnonChatsUnseenNumber = (inboxId) => {
  console.log(anonChats);
  console.log(inboxId);
  console.log(anonChats[inboxId]);
  anonChats[inboxId]["unseenNumber"] = 0;
};

const getAnonChats = (inboxId) => {
  return anonChats[inboxId]["msgs"];
};

const deleteAnonChats = (inboxId) => {
  console.log("deleteAnonChats " + anonChats);
  delete anonChats[inboxId];
  console.log(anonChats.hasOwnProperty(inboxId));
};

const getAnonChatsWithUserId = (userId) => {
  return new Promise((resolve) => {
    let inboxId = "";
    for (let [key, value] of Object.entries(anonChats)) {
      console.log(value.msgs);
      let isFound = value.msgs.find((x) => x.senderId == userId);
      console.log("getAnonChatsWithUserId " + isFound?.inboxId);
      if (isFound != undefined) {
        inboxId = isFound.inboxId;
        break;
      }
    }
    if (inboxId != "") {
      console.log(anonChats[inboxId]["msgs"]);
      resolve(anonChats[inboxId]["msgs"]);
    } else {
      resolve(null);
    }
  });
};

const getAnonLastChatWithInboxId = (inboxId) => {
  let lastChatMsg = anonChats?.[inboxId]?.["msgs"]?.length - 1;
  return {
    chats: anonChats[inboxId]?.["msgs"]?.[lastChatMsg],
    unseenNumber: anonChats[inboxId]?.["unseenNumber"],
  };
};

const addUser = (userId, isAdmin, name, email, anonInboxId, socketId, isAnon) => {
  return new Promise((resolve) => {
    let foundIndex = users.findIndex((user) => user.userId === userId);
    foundIndex == -1
      ? users.push({
          userId,
          isAdmin,
          name,
          email,
          anonInboxId,
          socketId,
          isOnline: true,
          isAnon
        })
      : (users[foundIndex] = {
          userId,
          isAdmin,
          name,
          email,
          anonInboxId,
          socketId,
          isOnline: true,
          isAnon
        });
    resolve(users);
  });
};

const removeUser = (socketId) => {
  return new Promise((resolve) => {
    // users = users.filter((user) => user.socketId !== socketId); instead of removing set to null
    let foundUser = users.find((x) => x.socketId == socketId);
    if (foundUser != undefined) {
      foundUser["socketId"] = undefined;
      foundUser["isOnline"] = false;
    }
    resolve(users);
  });
};

const getUserByInbox = (inboxId) => {
  //only anon users have inboxId
  return users.find((x) => x.anonInboxId == inboxId);
};

const getUser = (userId) => {
  return new Promise((resolve) => {
    resolve(users.find((user) => user.userId == userId));
  });
};

const getUserList = () => {
  return users;
};

const setActiveInbox = (inboxId) => {
  activeInbox = inboxId;
};

const getActiveInbox = () => {
  return activeInbox;
};
const removeUserFromExistence = (inboxId) => {
  console.log(inboxId);
  let tempSocketHolder = "";
  let userFound = users.find((x) => x.anonInboxId == inboxId);
  console.log("removeUserFromExistence" + userFound);
  tempSocketHolder = userFound.socketId;
  users = users.filter((x) => x.anonInboxId != inboxId);
  return tempSocketHolder;
};
module.exports ={authenticateToken, addUser, removeUser, getUser, setActiveInbox, getActiveInbox, getUserByInbox, addAnonChats, removeUserFromExistence,
  getAnonChats, getUserList, getAnonChatsWithUserId, getAnonLastChatWithInboxId,resetAnonChatsUnseenNumber, deleteAnonChats};
