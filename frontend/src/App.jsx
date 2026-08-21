import { Link, NavLink, Route, Routes } from 'react-router-dom'
import CreatePost from './pages/CreatePost.jsx'
import Articles from './pages/Articles.jsx'
import Chatbot from './pages/Chatbot.jsx'
import PostDetail from './pages/PostDetail.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">I</span>
            <span>Ollama</span>
          </Link>
          <div className="header-actions">
            <nav className="main-nav" aria-label="Main navigation">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end to="/">Tag generator</NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/chat">Chatbot</NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/articles">Articles</NavLink>
            </nav>
            <span className="local-badge"><i /> Powered locally</span>
          </div>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<CreatePost />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/chat" element={<Chatbot />} />
          <Route path="/posts/:id" element={<PostDetail />} />
        </Routes>
      </main>
    </div>
  )
}
