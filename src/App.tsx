import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import PurchaseSummery from "./components/PurchaseSummery";

function App() {
  return (
    <Router>
      {/* <div className="min-h-screen bg-gray-50 flex flex-row"> */}
      {/* <Navbar /> */}
      {/* <main className="container   "> */}
      <Routes>
        <Route path="/" element={<PurchaseSummery />} />
        {/* <Route path="/sales" element={<SalesPage />} /> */}
        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        {/* <Route path="/settings" element={<SettingsPage />} /> */}
      </Routes>
      {/* </main> */}
      {/* </div> */}
    </Router >
  );
}

export default App;
