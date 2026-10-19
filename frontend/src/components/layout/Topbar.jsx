
import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/study-rooms': 'Study Rooms',
  '/study-planner': 'Study Planner',
  '/resources': 'Resources',
  '/study-tracking': 'Study Tracking',
  '/analytics': 'Analytics',
}

function Topbar() {
  const location = useLocation()
  const pageTitle = pageTitles[location.pathname] ?? 'StudySync'

  return (
    <header className="topbar">
      <div>
        <p className="topbar-eyebrow">YOUR LEARNING SPACE</p>
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      <div className="topbar-actions">
        <button
          className="icon-button"
          type="button"
          aria-label="Notifications"
          onClick={() => window.alert('Notifications will be added soon.')}
        >
          ♧
        </button>

        <div className="topbar-avatar" aria-label="User profile">
          S
        </div>
      </div>
    </header>
  )
}

export default Topbar
