
const weeklyHours = [
  { day: 'Mon', hours: 2.0 },
  { day: 'Tue', hours: 1.5 },
  { day: 'Wed', hours: 2.5 },
  { day: 'Thu', hours: 1.0 },
  { day: 'Fri', hours: 3.0 },
  { day: 'Sat', hours: 2.0 },
  { day: 'Sun', hours: 0.5 },
]

function WeeklyActivity() {
  const weeklyTotal = weeklyHours.reduce(
    (total, day) => total + day.hours,
    0,
  )

  return (
    <section className="activity-card">
      <div className="activity-header">
        <div>
          <h3>Weekly activity</h3>
          <p>Your study time throughout the week</p>
        </div>

        <div className="activity-total">
          <strong>{weeklyTotal.toFixed(1)} hrs</strong>
          <span>Total this week</span>
        </div>
      </div>

      <div className="activity-chart">
        {weeklyHours.map((day) => (
          <div className="activity-day" key={day.day}>
            <span className="activity-hours">{day.hours}h</span>

            <div className="activity-bar-track">
              <div
                className="activity-bar"
                style={{ height: `${(day.hours / 3) * 100}%` }}
                title={`${day.hours} hours`}
              />
            </div>

            <span className="activity-day-label">{day.day}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default WeeklyActivity
