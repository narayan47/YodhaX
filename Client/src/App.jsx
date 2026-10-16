import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Header from './Components/Header'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Header />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
