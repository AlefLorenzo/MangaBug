import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/config';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(API_BASE_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
            console.log('🔌 Connected to real-time server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
