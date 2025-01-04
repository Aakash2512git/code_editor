import{io} from 'socket.io-client';

export const initSocket=async()=>{
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5003';
    const options={
        'force new connection':true,
        reconnectionAttempt:'Infinity',
        timeout:10000,
        transports:['websocket'],
    

    };

    return io(socketUrl,options);
};
