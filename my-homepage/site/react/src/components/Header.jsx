import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: '홈' },
  { to: '/about', label: '프로필' },
  { to: '/career', label: '항해 일지' },
  { to: '/books', label: '저서' },
  { to: '/media', label: '미디어·채널' },
  { to: '/mentor', label: '항해 상담실' },
  { to: '/contact', label: '섭외 문의' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="rank-dot"></span>김승주 항해록
        </Link>
        <nav className={`primary-nav${open ? ' open' : ''}`} id="primaryNav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="nav-toggle"
          id="navToggle"
          aria-expanded={open}
          aria-controls="primaryNav"
          aria-label="메뉴 열기"
          onClick={() => setOpen((o) => !o)}
        >
          ☰
        </button>
      </div>
    </header>
  )
}
