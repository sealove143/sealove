import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Career from './pages/Career.jsx'
import Books from './pages/Books.jsx'
import Media from './pages/Media.jsx'
import Mentor from './pages/Mentor.jsx'
import Contact from './pages/Contact.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/career" element={<Career />} />
        <Route path="/books" element={<Books />} />
        <Route path="/media" element={<Media />} />
        <Route path="/mentor" element={<Mentor />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
    </Routes>
  )
}
