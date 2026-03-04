import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { NotificationProvider } from './context/NotificationContext'
import { WorkProvider } from './context/WorkContext'
import { UserAuthProvider } from './context/UserAuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { SocketProvider } from './context/SocketContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <NotificationProvider>
                <SocketProvider>
                    <UserAuthProvider>
                        <AdminAuthProvider>
                            <WorkProvider>
                                <App />
                            </WorkProvider>
                        </AdminAuthProvider>
                    </UserAuthProvider>
                </SocketProvider>
            </NotificationProvider>
        </BrowserRouter>
    </React.StrictMode>
)
