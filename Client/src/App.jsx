
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
import PlacementDashboard from "./pages/PlacementDashboard";
import ApplicationPipeline from "./pages/ApplicationPipeline";

import "./App.css";
import StudentSkillAssessment from "./Components/Student/StudentSkillAssessment";

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
          <Route
  path="/placement/dashboard"
  element={
    <ProtectedRoute allowedRoles={["placementcell"]}>
      <PlacementDashboard />
    </ProtectedRoute>
  }
/>
  <Route
  path="/student/SkillAssessment"
  element={
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentSkillAssessment />
    </ProtectedRoute>
  }
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
          <Route
  path="/student/applications"
  element={
    <ProtectedRoute allowedRoles={["student"]}>
      <ApplicationPipeline />
    </ProtectedRoute>
  }
/>

<Route
  path="/placement/applications"
  element={
    <ProtectedRoute allowedRoles={["placementcell"]}>
      <ApplicationPipeline />
    </ProtectedRoute>
  }
/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
