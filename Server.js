const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const cors = require('cors'); // Import the cors middleware
const axios = require('axios'); // Import axios for making API requests


app.use(cors());
app.use(express.json());


const server = http.createServer(app);
const io = new Server(server);

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

  const KEY=process.env.key;
  const options = {
    method: 'POST',
    url: 'https://cpp-code-compiler.p.rapidapi.com/',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key':'4cd154c434msh7f8a19726696913p161acbjsnf5b8428dc1a' ,
      'X-RapidAPI-Host': 'cpp-code-compiler.p.rapidapi.com'
    },
    data: {
      code: code,
      version: 'latest'
    }
  };
  
  try {
    const response = await axios.request(options);
    console.log(response.data.output);
    res.json(response.data.output);
  } catch (error) {
    console.error(error);
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
