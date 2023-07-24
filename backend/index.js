const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require("path");

const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {cors: {
    origin: '*',
  }});

const port = 3000;
const ip = '192.168.0.11';

mongoose.connect('mongodb://127.0.0.1:27017/chatdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to Database");
}).catch((err) => {
  console.log("Not Connected to Database ERROR! ", err);
});

const schema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
})

const ChatMessage = mongoose.model('ChatMessage', schema);

app.use(bodyParser.json());
app.use(cors());

app.use(express.static(path.join('../frontend')));

app.post('/chat', async (req, res) => {
  const {username, message} = req.body;

  try {
    const newMessage = new ChatMessage({username, message});

    const savedMessage = await newMessage.save();

    return res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Ошибка при сохранении сообщения:', err);
    return res.status(500).json({error: 'Произошла ошибка при сохранении сообщения.'});
  }
});

app.get('/chat', async (req, res) => {
  try {
    const oldMessages = await ChatMessage.find({}).exec();
    return res.status(200).json(oldMessages);
  } catch (err) {
    console.error('Ошибка при получении истории чата:', err);
    return res.status(500).json({ error: 'Произошла ошибка при получении истории чата.' });
  }
});

http.listen(port, ip, () => {
  console.log(`Сервер чата запущен на порту ${port}`);
});

io.on('connection', (socket) => {
  socket.on('sendMessage', async (data) => {
    try {
      const { username, message } = data;
      const newMessage = new ChatMessage({ username, message });
      const savedMessage = await newMessage.save();
      io.emit('newMessage', savedMessage);
    } catch (err) {
      console.error('Ошибка при сохранении сообщения:', err);
    }
  });
});

io.listen(3001);
