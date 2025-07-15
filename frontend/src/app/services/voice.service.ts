import { Injectable } from '@angular/core';
import { WebSocketService } from '../web-socket-service';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private peers = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private isMuted = false;

  constructor(private wss: WebSocketService) {
    console.log('VoiceService Initialized');
    this.wss.bindHandler("webrtc.offer", this.handleOffer.bind(this));
    this.wss.bindHandler("webrtc.answer", this.handleAnswer.bind(this));
    this.wss.bindHandler("webrtc.ice-candidate", this.handleIceCandidate.bind(this));
    this.wss.bindHandler("peer.disconnected", ({ fromId }: { fromId: string }) => {
      console.log(`[VOICE] Peer ${fromId} disconnected.`);
      this.peers.get(fromId)?.close();
      this.peers.delete(fromId);
    });
  }

  async initLocalAudio() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = this.localStream.getAudioTracks()[0];
    } catch (error) {
    }
  }

  async startCall(peerIds: string[]) {
    await this.initLocalAudio();
    if (!this.localStream) return console.error('[VOICE] Cannot start call without a local audio stream.');

    // 1. Find the opponent's ID
    const opponentId = peerIds.find(id => id !== this.wss.socketId);
    if (!opponentId) return;

    // 2. Determine who is the caller based on a simple string comparison
    const isCaller = this.wss.socketId! < opponentId;

    // 3. The "caller" sends the offer; the "callee" waits.
    if (isCaller) {
      const pc = this.createPeerConnection(opponentId);
      this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream!));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.wss.emit("webrtc.offer", { targetId: opponentId, offer });
    } else {
      //Create the connection object and wait for the offer to arrive.
      this.createPeerConnection(opponentId);
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wss.emit("webrtc.ice-candidate", { targetId: peerId, candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.muted = false;
      audio.autoplay = true;
      audio.play().catch(e => console.error("[VOICE] Audio playback failed.", e));
      document.body.appendChild(audio);
    };
    this.peers.set(peerId, pc);
    return pc;
  }

  private async handleOffer({ fromId, offer }: any) {
    const pc = this.createPeerConnection(fromId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    if (!this.localStream) await this.initLocalAudio();
    this.localStream!.getTracks().forEach((track) => pc.addTrack(track, this.localStream!));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.wss.emit("webrtc.answer", { targetId: fromId, answer });
  }

  private async handleAnswer({ fromId, answer }: any) {
    const pc = this.peers.get(fromId);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async handleIceCandidate({ fromId, candidate }: any) {
    const pc = this.peers.get(fromId);
    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  toggleMute(): boolean {

    this.isMuted = !this.isMuted;

    if (!this.localStream) {
      return this.isMuted;
    }

    const audioTracks = this.localStream.getAudioTracks();

    audioTracks.forEach(track => {
      const newEnabledState = !this.isMuted;
      track.enabled = newEnabledState;
    });

    return this.isMuted;
  }
}