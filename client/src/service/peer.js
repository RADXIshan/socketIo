class PeerService{
    constructor(){
        if(!this.peer){
            this.peer = new RTCPeerConnection({
                iceServers: [{
                    urls:[
                        'stun:stun.l.google.com:19302',
                        'stun:global.stun.twilio.com:3478',
                    ],
                }]
            })
        }
    }

    // add local stream tracks, but avoid adding duplicates
    addLocalTracks(stream){
        if(!this.peer || !stream) return;
        const existingTrackIds = this.peer.getSenders().map(s => s.track && s.track.id).filter(Boolean);
        for(const track of stream.getTracks()){
            if(!existingTrackIds.includes(track.id)){
                try{
                    this.peer.addTrack(track, stream);
                }catch(e){
                    // ignore if browser throws for duplicate or other minor errors
                    console.warn('addTrack failed', e);
                }
            }
        }
    }

    async getAnswer(offer){
        if(this.peer){
            // accept plain RTCSessionDescriptionInit or RTCSessionDescription
            const remoteDesc = (offer instanceof RTCSessionDescription) ? offer : new RTCSessionDescription(offer);
            await this.peer.setRemoteDescription(remoteDesc);
            const ans = await this.peer.createAnswer();
            await this.peer.setLocalDescription(new RTCSessionDescription(ans));
            return ans;
        }
    }

    // expose setRemoteDescription/setLocalDescription helpers
    async setRemoteDescription(desc){
        if(this.peer){
            const remoteDesc = (desc instanceof RTCSessionDescription) ? desc : new RTCSessionDescription(desc);
            await this.peer.setRemoteDescription(remoteDesc);
        }
    }

    async setLocalDescription(desc){
        if(this.peer){
            const localDesc = (desc instanceof RTCSessionDescription) ? desc : new RTCSessionDescription(desc);
            await this.peer.setLocalDescription(localDesc);
        }
    }

    async getOffer() {
        if(this.peer){
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(new RTCSessionDescription(offer));
            return offer;
        }
    }
}

export default new PeerService();
