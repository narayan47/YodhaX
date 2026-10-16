import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Header from './Components/Header'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Header />} />
        <Route path="/jobs" element={<Jobs />} />
         <Route path="/jobs/:jobId" element={<JobDetails />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
