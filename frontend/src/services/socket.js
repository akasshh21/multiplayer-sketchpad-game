import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:8000';

class SocketService{
    constructor(){
        this.socket = null;
    }


    connect(){
        if(!this.socket){
        this.socket = io(BACKEND_URL, {
            transports: ['websocket']
        });
        }
        return this.socket;
    }

    disconnect(){
        if(this.socket){
        this.socket.disconnect();
        this.socket = null;
        }
    }


    getSocket(){
        return this.socket;
    }
}



export default new SocketService();