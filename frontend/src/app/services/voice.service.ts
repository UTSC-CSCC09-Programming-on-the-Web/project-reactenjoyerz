import { Injectable } from '@angular/core';
import { WebSocketService } from '../web-socket-service';

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private peers = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private wss: WebSocketService;
  private isMuted = false;

  constructor(wss: WebSocketService) {
    this.wss = wss;

    this.wss.bindHandler("webrtc.offer", this.handleOffer.bind(this));
    this.wss.bindHandler("webrtc.answer", this.handleAnswer.bind(this));
    this.wss.bindHandler("webrtc.ice-candidate", this.handleIceCandidate.bind(this));
    this.wss.bindHandler("disconnect", ({ fromId }) => {
    const pc = this.peers.get(fromId);
        if (pc) {
            pc.close();
            this.peers.delete(fromId);
        }
        });
  }

  async initLocalAudio() {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Local audio tracks:", this.localStream?.getAudioTracks());
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.updateTrackState();
    return this.isMuted;
  }

  private updateTrackState() {
    if (!this.localStream) return;
    for (const track of this.localStream.getAudioTracks()) {
        track.enabled = !this.isMuted;
        console.log(`Track ${track.id} enabled: ${track.enabled}`);
    }
  }

  async startCall(peerIds: string[]) {
    if (!this.localStream) await this.initLocalAudio();

    for (const peerId of peerIds) {
      if (peerId === this.wss.socketId) continue;

      const pc = this.createPeerConnection(peerId);
      this.localStream!.getTracks().forEach((track) => pc.addTrack(track, this.localStream!));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.wss.emit("webrtc.offer", { targetId: peerId, offer });
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wss.emit("webrtc.ice-candidate", {
          targetId: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
        console.log("Receiving audio stream from:", peerId, event.streams[0]);
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.controls = true;
        audio.play().catch((e) => {
            console.error("Failed to play audio:", e);
        });
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
}