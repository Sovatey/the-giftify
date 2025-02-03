import React from "react";
import ReactDOM from "react-dom/client";  // Use the "client" version of ReactDOM
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import App from './App'; // Import your main App component

// Create root and render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>  {/* Wrap the app in BrowserRouter */}
    <App />  {/* Your app component */}
  </BrowserRouter>
);
