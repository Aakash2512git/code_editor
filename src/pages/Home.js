import React, { useState } from 'react'
import {v4 as uuidv4} from 'uuid';
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom';

const Home = () => {
      const navigate=useNavigate();
       const [roomId,setRoomId]=useState('');
       const [username,setUsername]=useState('');

    const createNewRoom=(e)=>{
         e.preventDefault();
         const id=uuidv4();
         setRoomId(id);
         toast.success('created a new room');
    };

const joinRoom=()=>{
    if(!roomId||!username){
     toast.error('ROOM ID and username required')
     return;
    }
    //redirect to editor
    navigate(`/editor/${roomId}`,{
        state:{
            username,
        },
    });

};

const handleInputEnter=(e)=>{
    if(e.key==='Enter'){
        //e.preventDefault();
        if(!roomId||!username){
            toast.error('ROOM ID and username required')
            return;
           }
        joinRoom();

    }
};

  return (
    <div className='homePageWrapper'>
        <div className='formWrapper'>
            <img src="/B.png" className='homelogo' height="75px" alt="code-logo"/>  
            <h4 className='mainLabel'>Paste roomId</h4>   
            <div className='inputGroup'>
                <input className='inputBox' type='text' placeholder='roomId'
                onChange={(e)=>setRoomId(e.target.value)}
                value={roomId} 
               onKeyUp={handleInputEnter} />

                <input className='inputBox' type='text' placeholder='username'
                onChange={(e)=>setUsername(e.target.value)}
                value={username}
                onKeyUp={handleInputEnter}/>

                <button className='btn joinBtn' onClick={joinRoom}>Join</button>
                <span className='createInfo'>
                    If don't have an invite then create &nbsp;
                    <a  onClick={createNewRoom} href='' className='createNewbtn'>new room</a>
                </span>
            </div>
         </div> 
         <footer><h4>Built  by <a href='https://github.com/Aakash2512git'>Aakash</a></h4></footer>  
    </div>
  )
}

export default Home
