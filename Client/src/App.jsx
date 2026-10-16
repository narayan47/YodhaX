import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Header from './Components/Header'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'
import StudentDashbord from './pages/StudentDashbord'
import Home from './Components/Home'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
         <Route path="/jobs/:jobId" element={<JobDetails />} />
         <Route path="/applications" element={<StudentDashbord />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
