import { useCallback, useEffect, useState } from 'react'
import { useSocket } from "../context/SocketProvider"
import { useNavigate } from 'react-router';

const Lobby = () => {

  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const navigate = useNavigate();

  const socket = useSocket();

  const handleSubmitForm = useCallback((e) => {
    e.preventDefault();
    socket.emit("room:join", { email, room });
  }, [email, room, socket])

  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`)
  }, [navigate])

  useEffect(() => {
    socket.on('room:join', handleJoinRoom);
    return () => {
      socket.off('room:join', handleJoinRoom);
    }
  }, [socket, handleJoinRoom]);
  

  return (
    <div className='container'>
        <h1>Lobby</h1>
        <form onSubmit={handleSubmitForm} style={{ padding: '1rem' }}>
            <label htmlFor="email">Email Id</label>
            <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} style={{display: "block", border: "1px solid black"}} />
            <br />
            <label htmlFor="room">Room Number</label>
            <input type='text' value={room} onChange={(e) => setRoom(e.target.value)} style={{display: "block", border: "1px solid black"}} />
            <br />
            <div className='btn'>
              <button>Join</button>
            </div>   
        </form>
    </div>
  )
}

export default Lobby