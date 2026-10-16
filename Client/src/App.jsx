
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Header from "./Components/Header";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import StudentDashbord from "./pages/StudentDashbord";
import Home from "./Components/Home";
import AuthPage from "./pages/AuthPage";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./Components/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/jobs" element={<Jobs />} />

          <Route
            path="/jobs/:jobId"
            element={<JobDetails />}
          />

          <Route
            path="/applications"
            element={<StudentDashbord />}
          />

          <Route path="/login" element={<AuthPage />} />

          <Route path="/signup" element={<AuthPage />} />

          <Route
            path="/verify-email"
            element={<VerifyEmail />}
          />

          {/* Student protected routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["student"]} />
            }
          >
            <Route
              path="/student/dashboard"
              element={<StudentDashbord />}
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
