import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Make sure this file exists and is correct
import App from './App.js'; // This line is crucial for resolving the 'Module not found' error

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
