const express = require('express');
const app = express();
const http = require('http');
const path=require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const cors = require('cors'); // Import the cors middleware
const axios = require('axios'); // Import axios for making API requests
require('dotenv').config();




app.use(cors());
app.use(express.json());


const server = http.createServer(app);
const io = new Server(server);

// Serve the React app
app.use(express.static(path.join(__dirname, 'build')));

// Handle React app routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



const userSocketMap={};

function getAllConnectedClients(roomId){
 return Array.from(io.sockets.adapter.rooms.get(roomId)||[]).map((socketId)=>{
        return{
          socketId,
          username:userSocketMap[socketId],
        }
 });

}



app.post('/compile', async (req, res) => {
  const code = req.body.code; // Get code from request body
    console.log(code);

  
  const options = {
    method: 'POST',
    url: 'https://cpp-code-compiler.p.rapidapi.com/',
    headers: {
      'content-type': 'application/json',
      'Accept': 'application/json',
      'X-RapidAPI-Key':process.env.REACT_APP_KEY,
      'X-RapidAPI-Host': 'cpp-code-compiler.p.rapidapi.com'
    },
    data: {
      code: code,
      version: 'latest'
    }
  };
  
  try {
    const response = await axios.request(options);

    if (response.data && response.data.output) {
      console.log(process.env.REACT_APP_KEY);
      console.log("logging response...")
      res.send(response.data.output);
      console.log(response.data.output);
    } else {
      res.status(500).send("API response does not contain the expected output.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error in API request.");
  }
});



 





io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on(ACTIONS.JOIN,({roomId,username})=>{
        userSocketMap[socket.id]=username;
        socket.join(roomId);
        const clients=getAllConnectedClients(roomId);   
        clients.forEach(({ socketId }) => {
          io.to(socketId).emit(ACTIONS.JOINED, {
              clients,
              username,
              socketId: socket.id,
          });
  });
});

socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
  socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
});

socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
  io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
});


        socket.on('disconnecting',()=>{
          const rooms=[...socket.rooms];
          rooms.forEach((roomId)=>{
            socket.in(roomId).emit(ACTIONS.DISCONNECTED,{
              socketId:socket.id,
              username:userSocketMap[socket.id],
            });
          });
delete userSocketMap[socket.id];
  socket.leave();

        });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
