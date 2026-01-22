import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Sidebar from "./Components/Sidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 📄 Main Pages
import Dashboard from "./Pages/Dashboard";
import Customers from "./Pages/Customers";
import Report from "./Pages/Report";
import CMS from "./Pages/CMS";
import Tax from "./Pages/Tax";
import Payments from "./Pages/Payments";
import Subscription from "./Pages/Subscription";
import Setting from "./Pages/Setting";

// 👤 Customer Steps
import CustomerDetail from "./Pages/CustomerSteps/CustomerDetail";


// report detail
import ReportDetail from "./Pages/ReportSteps/ReportDetail";

// 💳 Payment Steps
import PaymentDetail from "./Pages/PaymentSteps/PaymentDetail";


// 🔐 Auth & Layout Components
import ProtectedRoute from "./Components/ProtectedRoute";
import UserLayout from "./Components/UserLayout";

function App() {
  return (
    <Router>
       <ToastContainer position="bottom-right" autoClose={3000} />
      <Routes>
        {/* ---------- Public Route ---------- */}
        <Route path="/login" element={<Login />} />

        {/* ---------- Protected Routes ---------- */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          {/* 📊 Main Pages */}
          <Route path="dashboard" element={<Dashboard />} />
        
          <Route path="customers" element={<Customers />} />
          <Route path="report" element={<Report />} />
          <Route path="cms" element={<CMS />} />
          <Route path="tax" element={<Tax />} />
          <Route path="payments" element={<Payments />} />
          <Route path="subscription" element={<Subscription />} />
       
          <Route path="setting" element={<Setting />} />

        

       
          {/* 👤 Customer Steps */}
          <Route path="customer-detail/:id" element={<CustomerDetail />} />
        
          {/* report steps */}
          <Route path="report-detail/:id" element={<ReportDetail />} />

          {/* 💳 Payment Steps */}       
          <Route path="payment-detail/:id" element={<PaymentDetail />} />
      
        </Route>

        {/* ---------- Fallback ---------- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;


