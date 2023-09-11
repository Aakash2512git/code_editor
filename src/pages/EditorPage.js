import React, { useEffect, useRef, useState } from 'react'
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../Socket';
import ACTIONS from '../Actions';
import { useLocation,useNavigate ,Navigate,useParams} from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios'; // Import axios library





const EditorPage = () => {
    const socketRef=useRef(null);
    const codeRef=useRef(null);
    const location=useLocation();
    const {roomId}=useParams();
    const reactNavigator=useNavigate();

    const [clients,setClients]=useState([]);
    const [output, setOutput] = useState('');


    const handleCompile = async () => {
      try {
          const response = await axios.post('http://localhost:5000/compile', {
              code: codeRef.current,
          });
  
          // Update the output state with the compilation result
          setOutput(response.data);
      } catch (error) {
          console.error('Compilation error:', error);
          toast.error('Error compiling code');
          setOutput('Error compiling code');
      }
  };
  

    useEffect(()=>{
      const init=async()=>{
         socketRef.current=await initSocket();
         socketRef.current.on('connect_error', (err) => handleErrors(err));
         socketRef.current.on('connect_failed', (err) => handleErrors(err));

         function handleErrors(e) {
             console.log('socket error', e);
             toast.error('Socket connection failed, try again later.');
             reactNavigator('/');
        
         }

         socketRef.current.emit(ACTIONS.JOIN,{
          roomId,
          username:location.state?.username,
         });
         //listning for joined evevnt
         socketRef.current.on(ACTIONS.JOINED,({clients,username,socketId})=>{
              if(username!==location.state?.username)
              {
                    toast.success(`${username} joined the room.`);
                    console.log(`${username} joined`);
              }

              setClients(clients);
              socketRef.current.emit(ACTIONS.SYNC_CODE,{
                code:codeRef.current,
                socketId,
              });
         })

          //listening for dissconnected

          socketRef.current.on(ACTIONS.DISCONNECTED,({socketId,username})=>{
            toast.success(`${username} left the room`);
            setClients((prev)=>{
              return prev.filter(client=>client.socketId!==socketId);
            })
          })
      };
          init();
          return ()=>{
             socketRef.current.disconnect();
             socketRef.current.off(ACTIONS.JOINED);
             socketRef.current.off(ACTIONS.DISCONNECTED);
          }
    },[]);
   
      async function copyRoomId(){
        try{
              await navigator.clipboard.writeText(roomId);
              toast.success('Room ID has been copied');
        }catch(err){
                  toast.error('Could not copy ROOM ID');
                  console.log(err);
        }
      }

       function leaveRoom(){
          reactNavigator('/');
       }


  if(!location.state){
   return <Navigate to="/"/>
  }
  return (
    <div className='mainwrap'>
       <div className='aside'>
        <div className='asideInner'>

           <div className='logoimage'><img src='/B.png' alt='logo' className='logo'/></div>
           <h3>Connected</h3>

           <div className='clientlist'>
             {
              clients.map((client)=>(
                <Client key={client.socketId} username={client.username}/>
              ))
             }

           </div>
        </div>
        <div>
          <button className='btn cpyBtn' onClick={copyRoomId}>Copy RoomId</button>
          <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
          <button className='btn submit' onClick={handleCompile}>Submit</button>


        </div>
        <div className='outputArea'>
                    <pre>{output}</pre>
                </div>
        </div> 
       <div className='editor'>
        <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code)=>{codeRef.current=code}}/>
        <div >
       </div>
       </div>
       
      
    </div>
  )
}

export default EditorPage
