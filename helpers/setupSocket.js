const { v4: uuidv4 } = require('uuid');
const { addUser, removeUser, getUser, getActiveInbox, addAnonChats, getUserList, removeUserFromExistence } = require("../helpers/socketHelpers");

const setupSocket = (app) => {
  const server = require("http").createServer(app);
  const socketio = require("socket.io");
  const io = socketio(server);
  const User = require("../models/User");
  const Chat = require("../models/Chat");
  const Inbox = require("../models/Inbox");

  // Socket IO
  io.on("connection", (socket) => {
    console.log("a user connected");

    // Setup DB
    require("./setupDB");

    socket.on("checkAdminOnline", ({}, cb) => {
      let users = getUserList();
      console.log(users);
      cb(users);
    });

    function generateRandom() {
        return new Promise(resolve => {
            resolve(uuidv4().replace(/-/g, ''));
        });
    }
    socket.on("joinUser", async ({ name, email, userId, isAnon }, cb) => {
        //take userId, isAdmin and socketId and store in users array. 
        try {
            console.log("joinUser ID" + userId);
            let foundUser = await User.findByPk(userId, { raw: true });
            let isAdmin = 0;
            let anonInboxId = "";
            console.log("joinUser isAnon"+ isAnon);
            //check if it is anonymous. 
            if (foundUser) {
                isAdmin = foundUser.isAdmin
                name = foundUser.username
                email = foundUser.email
                anonInboxId = ""
            } else {
                // check if the user is already in memory, then dont set new nonInboxId
                console.log(userId);
                let isFoundExistingUser = await getUser(userId);
                console.log("joinUser anonInboxId" + isFoundExistingUser?.anonInboxId);
                if (isFoundExistingUser) {// found the anon user
                    anonInboxId = isFoundExistingUser.anonInboxId;
                    // anonInboxId = uuidv4().replace(/-/g, ''); //generate inbox id for anonymous.
                }
                else{
                    anonInboxId = await generateRandom();
                }
            }

            console.log(anonInboxId);
            let users = await addUser(userId, isAdmin, name, email, anonInboxId, socket.id, isAnon);
            let userIdList = users.map(({ socketId, ...rest }) => rest);
            io.emit("getUsers", userIdList);
            cb({ success: true })
        } catch (err) {
            cb({ success: false })
            console.log(err);
        }
    });

    socket.on("sendMessage", async ({ senderId, receiverId, msg, msgDate, type}, cb) => {
        // find the inbox id by searching sender and receiver. if have name then anonymous, dont want to save their message
        let sender = await getUser(senderId);
        let receiver = await getUser(receiverId); // to get socket Id
        // try catch here to handle if user goes offline and io.to doesnt work.
        console.log("sendMessage senderId: " + senderId);
        console.log("sendMessage receiverId: " + receiverId);
        console.log(sender);
        try {
            let foundInbox = '';
            // check for inbox. if null means anon users.
            if (sender.isAdmin == 1) { //sender is the admin
                foundInbox = await Inbox.findOne({ where: { senderId: receiverId } });
            } else { //sender is the user
                foundInbox = await Inbox.findOne({ where: { senderId: sender.userId } });
            }
            console.log("sendMessage FoundINBOX:" + foundInbox);
            let createdChat = "";
            // each message from registered user to reg user is saved into db then emit to receipient, non active inbox we update inbox details too
            if (foundInbox) { // foundInbox not null means its a reg user or admin sending
                // let foundInbox = '';
                // if(sender.isAdmin==1){
                // 	foundInbox = await Inbox.findOne({$and:[{ownerId:sender.userId,senderId:receiver.userId}]});
                // }else{
                // 	foundInbox = await Inbox.findOne({$and:[{ownerId:receiver.userId,senderId:sender.userId}]});
                // }
                createdChat = await Chat.create({
                    msg, msgDate, file: type, senderId, inboxId: foundInbox["id"]
                });

                let activeInboxId = getActiveInbox(); // add unseenNumber for non active inbox. Active inbox is set for reg users only.

                foundInbox.update({
                    unseenNumber: activeInboxId != foundInbox.id ? foundInbox["unseenNumber"] += 1 : foundInbox["unseenNumber"],//update unseen for non currently open inbox
                    lastMsgReceived: msg,
                    lastMsgReceivedDate: msgDate,
                }).then(updatedInbox => {
                    console.log("SendMessage " + updatedInbox);
                });



            } else { // anon users put their message in memory instead of saving to db

                if (sender.isAdmin == 1 && receiver?.socketId != undefined) {
                    createdChat = addAnonChats(receiver.anonInboxId, { msg, msgDate, file: type, senderId, inboxId: sender.anonInboxId })
                } else if (sender.isAdmin == 0 && receiver?.socketId != undefined) {
                    createdChat = addAnonChats(sender.anonInboxId, { msg, msgDate, file: type, senderId, inboxId: sender.anonInboxId });
                } else {
                    // the anon user is offline
                    throw "Receiver offline or error sending message";
                }
            }

            if (receiver?.socketId == undefined && foundInbox != null) { //receiver offline and a reg user
                cb({ success: true , msg:createdChat});
            } else if (receiver?.socketId == undefined) { // if anon user offline
                throw ("Receiver offline or error sending message");
            } else {
                cb({ success: true , msg:createdChat});
                io.to(receiver.socketId).emit("receiveMessage", {id:createdChat?.id, msg, senderId, msgDate, type, realInboxId: foundInbox?.id });
            }
        } catch (error) {
            // error sending message
            cb({ success: false });
            console.log(error);
        }
    });

    socket.on("disconnect", async () => {
        console.log("User disconnected")
        let users = await removeUser(socket.id);
        console.log(users);
        io.emit("getUsers", users);
    });
    socket.on("resolve", ({ anonInboxId }) => {
        let socketHolder = removeUserFromExistence(anonInboxId);
        console.log("resolve" + socketHolder);
        io.to(socketHolder).emit("resolveReceived");
    });
    //delete inbox
    socket.on("deleted", async ({ userId }) => {
        console.log("deleted " + userId);
        const foundUser = await getUser(userId)
        console.log("Socket Deleted" + foundUser);
        // have to check if user is even connected yet. If yes, only socket emit
        if(foundUser){
            io.to(foundUser.socketId).emit("resolveReceived");
        }
    });
    //delete one msg
    socket.on("deletedMsg", async ({ userId, msgId }) => {
        console.log("deleted " + msgId);
        const foundUser = await getUser(userId)
        console.log("Socket Deleted" + foundUser);
        if (foundUser){
            io.to(foundUser.socketId).emit("messageDeletedAck",{msgId});
        }
    });
	});

  return server;
};

module.exports = setupSocket;
