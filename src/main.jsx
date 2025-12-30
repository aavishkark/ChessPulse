import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
    <BrowserRouter>
        <ChakraProvider value={defaultSystem}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ChakraProvider>
    </BrowserRouter>
);
