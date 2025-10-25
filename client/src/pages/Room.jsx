import { useCallback, useEffect, useRef, useState } from "react";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const Room = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [mystream, setMystream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined the room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMystream(stream);

    if (peer?.peer && stream) {
      for (const track of stream.getTracks()) {
        try {
          peer.peer.addTrack(track, stream);
        } catch (_) {}
      }
    }

    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMystream(stream);

      if (peer?.peer && stream) {
        for (const track of stream.getTracks()) {
          try {
            peer.peer.addTrack(track, stream);
          } catch (_) {}
        }
      }

      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const handleCallAccepted = useCallback(async ({ ans }) => {
    try {
      await peer.setRemoteDescription(ans);
      console.log("Call accepted and remote description set");
    } catch (err) {
      console.error("Failed to set remote description:", err);
    }
  }, []);

  const handleNegotiationNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegotiationIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegotiationFinal = useCallback(async ({ ans }) => {
    try {
      await peer.setRemoteDescription(ans);
    } catch (err) {
      console.error("Failed to set remote description for negotiation:", err);
    }
  }, []);

  useEffect(() => {
    if (!peer?.peer) return;

    const handleTrack = (ev) => {
      if (ev.streams && ev.streams[0]) {
        setRemoteStream(ev.streams[0]);
      } else {
        setRemoteStream((prev) => {
          const tracks = prev ? prev.getTracks() : [];
          return new MediaStream([...tracks, ev.track]);
        });
      }
    };

    peer.peer.addEventListener("track", handleTrack);
    return () => peer.peer.removeEventListener("track", handleTrack);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
    return () =>
      peer.peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
  }, [handleNegotiationNeeded]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegotiationIncoming);
    socket.on("peer:nego:final", handleNegotiationFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegotiationIncoming);
      socket.off("peer:nego:final", handleNegotiationFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegotiationIncoming,
    handleNegotiationFinal,
  ]);

  useEffect(() => {
    if (myVideoRef.current && mystream) {
      myVideoRef.current.srcObject = mystream;
      const p = myVideoRef.current.play();
      if (p?.catch) p.catch(() => {});
    }
    return () => {
      if (myVideoRef.current) myVideoRef.current.srcObject = null;
    };
  }, [mystream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      const p = remoteVideoRef.current.play();
      if (p?.catch) p.catch(() => {});
    }
    return () => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, [remoteStream]);

  useEffect(() => {
    return () => {
      if (mystream) mystream.getTracks().forEach((t) => t.stop());
    };
  }, [mystream]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>

      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}

      {mystream && (
        <>
          <h2>My Stream</h2>
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            muted
            height="300"
            width="400"
            style={{
              borderRadius: "10px",
              transform: "rotateY(180deg)",
              border: "2px solid #000",
              objectFit: "cover",
              backgroundColor: "#000",
            }}
          />
        </>
      )}

      {remoteStream && (
        <>
          <h2>Remote Stream</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            height="300"
            width="400"
            style={{
              borderRadius: "10px",
              transform: "rotateY(180deg)",
              border: "2px solid #000",
              objectFit: "cover",
              backgroundColor: "#000",
            }}
          />
        </>
      )}
    </div>
  );
};

export default Room;
