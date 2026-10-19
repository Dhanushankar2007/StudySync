
const stats = [
  {
    label: 'Study hours',
    value: '12.5 hrs',
    detail: 'This week',
    icon: '◷',
  },
  {
    label: 'Sessions completed',
    value: '8',
    detail: 'This week',
    icon: '✓',
  },
  {
    label: 'Study streak',
    value: '5 days',
    detail: 'Keep it going!',
    icon: '↗',
  },
  {
    label: 'Goals completed',
    value: '3 of 5',
    detail: 'Weekly goals',
    icon: '◎',
  },
]

function StatsGrid() {
  return (
    <section className="stats-grid" aria-label="Study statistics">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <div className="stat-card-top">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-icon" aria-hidden="true">
              {stat.icon}
            </span>
          </div>

          <p className="stat-value">{stat.value}</p>
          <p className="stat-detail">{stat.detail}</p>
        </article>
      ))}
    </section>
  )
}

export default StatsGrid
