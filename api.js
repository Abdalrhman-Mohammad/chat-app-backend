
const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
const socketIO = require('socket.io')(http, {
  cors: {

      // origin: '*',
  },
});
const PORT = 4000
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());
let allUsers = [];
let allChats = [];
let messagesOfChats = [];
let isTyping = [];
socketIO.on('connection', (socket) => {
  // console.log(`a user connected `, socket);
  socket.on('typing', (data) => {
    let idx = -1;
    const foundChat = isTyping.filter((chat, index) => {
      if (chat.title == data.title) {
        idx = index;
      }
      return (chat.title == data.title);
    });

    if (idx != -1) {
      isTyping[idx].isTyping = data.isTyping;
    }
    console.log(data, foundChat[0].isTyping);
    socket.emit('typing', foundChat[0].isTyping);
  });
  socket.on('newMessage', (data) => {
    console.log(data);
    const foundChat = messagesOfChats.filter((chat) => {
      return (chat.title == data.title);
    });
    console.log(foundChat);
    foundChat[0].messages.unshift(data);
    socket.broadcast.emit('newMessage', foundChat[0].messages);
  });
  socket.on('findChat', (title) => {
    console.log('title : ', title);
    const foundChat = messagesOfChats.filter((chat) => {
      return (chat.title == title);
    });
    socket.emit('allMessage', foundChat[0].messages);
  });
});
app.get('/api', (req, res) => {
  console.log('hello');
  res.json({});
})
app.post('/chat/add', (req, res) => {
  try {
    console.log('hello', req.body);
    const foundChat = allChats
                          .map((chat) => {
                            return (chat.title == req.body.title);
                          })
                          .indexOf(true) != -1;
    if (!foundChat) {
      allChats.push({
        title: req.body.title,
      });
      messagesOfChats.push({
        title: req.body.title,
        messages: [],
      });
      isTyping.push({
        title: req.body.title,
        isTyping: false,
      })
    }
    allUsers.map((user, index) => {
      if (user.name == req.body.user.name) {
        const userExistInChat = user.chatsID.map((chat, index) => {
          return (chat == req.body.title);
        })
        if (userExistInChat.indexOf(true) == -1)
        user.chatsID.push(req.body.title);
      }
    })
    console.log('allChats', allChats);
    console.log('allUsers', allUsers);
    res.send({'status': true});
  } catch (error) {
    console.log(error);
    res.send({'status': false});
  }
})
app.post('/user', (req, res) => {
  console.log('hello', req.body.name, allUsers.length, allUsers[0], allUsers);
  const found = allUsers
                    .map((user) => {
                      return (user.name == req.body.name);
                    })
                    .indexOf(true) != -1;
  console.log(found, '--------------------')
  let user = null;
  if (found) {
    let userIdx = -1;
    allUsers.forEach((user, index) => {
      if (user.name == req.body.name) userIdx = index;
    })
    user = allUsers[userIdx];
  }
  console.log(user, '--------user--------')
  res.send({'status': found, user: user});
})
app.post('/user/register', (req, res) => {
  let user = {name: req.body.name, chatsID: []};
  let found = false;
  if (allUsers.map((user) => {return (user.name == req.body.name)})
          .indexOf(true) == -1) {
    allUsers.push(user);
  } else {
    user = allUsers[allUsers.indexOf(req.body.name)];
    found = true;
  }
  console.log('hello', '--------', allUsers, '----------');
  res.send({found: found, user: user});
})
http.listen(PORT, () => console.log(`server running on port ${PORT}`));