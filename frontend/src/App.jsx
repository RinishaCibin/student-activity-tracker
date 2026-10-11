
import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [activities, setActivities] = useState([])
  const [summary, setSummary] = useState({
    total_entries: 0,
    total_hours: 0,
    most_active_user: null,
  })

  const [form, setForm] = useState({
    name: '',
    activity: '',
    hours: '',
  })

  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadData() {
    try {
      const [activitiesResponse, summaryResponse] = await Promise.all([
        axios.get(`${API_URL}/activities`),
        axios.get(`${API_URL}/summary`),
      ])

      setActivities(activitiesResponse.data)
      setSummary(summaryResponse.data)
      setError('')
    } catch {
      setError('Cannot connect to backend. Please check if FastAPI is running.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  function resetForm() {
    setForm({ name: '', activity: '', hours: '' })
    setEditId(null)
  }

  function handleEdit(item) {
    setForm({
      name: item.name,
      activity: item.activity,
      hours: String(item.hours),
    })

    setEditId(item.id)
    setMessage('')
    setError('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    const hours = Number(form.hours)
    const name = form.name.trim()
    const activity = form.activity.trim()

    if (!name || !activity) {
      setError('Please enter the student name and activity.')
      return
    }

    if (
      !form.hours ||
      !Number.isFinite(hours) ||
      hours <= 0 ||
      hours > 24
    ) {
      setError('Hours must be greater than 0 and at most 24.')
      return
    }

    setLoading(true)

    try {
      const payload = { name, activity, hours }

      if (editId !== null) {
        await axios.put(`${API_URL}/activities/${editId}`, payload)
        setMessage('Activity updated successfully!')
      } else {
        await axios.post(`${API_URL}/activities`, payload)
        setMessage('Activity added successfully!')
      }

      resetForm()
      await loadData()
    } catch (err) {
      setError(
        err.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Could not save activity. Please check the backend.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${item.name}'s activity: "${item.activity}"?`
    )

    if (!confirmed) return

    setMessage('')
    setError('')
    setActionLoading(true)

    try {
      await axios.delete(`${API_URL}/activities/${item.id}`)

      if (editId === item.id) {
        resetForm()
      }

      setMessage('Activity deleted successfully!')
      await loadData()
    } catch (err) {
      setError(
        err.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Could not delete activity. Please try again.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <main className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">STUDENT MANAGEMENT</p>
          <h1>Student Activity Tracker</h1>
          <p className="subtitle">
            Track student activities and monitor their progress.
          </p>
        </div>
        <div className="header-icon">📚</div>
      </header>

      {error && <div className="alert error-alert">{error}</div>}
      {message && <div className="alert success-alert">{message}</div>}

      <section className="summary-grid">
        <article className="summary-card">
          <div className="summary-icon purple">📋</div>
          <p>Total Entries</p>
          <h2>{summary.total_entries}</h2>
        </article>

        <article className="summary-card">
          <div className="summary-icon blue">⏱️</div>
          <p>Total Hours</p>
          <h2>{Number(summary.total_hours).toLocaleString()}</h2>
        </article>

        <article className="summary-card">
          <div className="summary-icon orange">🏆</div>
          <p>Most Active Student</p>
          <h2 className="active-name">
            {summary.most_active_user || 'No activities yet'}
          </h2>
        </article>
      </section>

      <section className="content-grid">
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <h2>{editId !== null ? 'Update Activity' : 'Add New Activity'}</h2>
              <p>
                {editId !== null
                  ? 'Edit the student activity details.'
                  : "Enter the student's activity details."}
              </p>
            </div>
            <span className="heading-icon">
              {editId !== null ? '✏️' : '＋'}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Student Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Anu"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              required
            />

            <label htmlFor="activity">Activity Description</label>
            <input
              id="activity"
              name="activity"
              type="text"
              placeholder="e.g. Reading"
              value={form.activity}
              onChange={handleChange}
              maxLength={250}
              required
            />

            <label htmlFor="hours">Hours Spent</label>
            <input
              id="hours"
              name="hours"
              type="number"
              placeholder="e.g. 2"
              min="0.01"
              max="24"
              step="any"
              value={form.hours}
              onChange={handleChange}
              required
            />

            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : editId !== null
                  ? 'Update Activity'
                  : '+ Add Activity'}
            </button>

            {editId !== null && (
              <button
                className="cancel-button"
                type="button"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        <section className="panel activities-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Activities</h2>
              <p>All recorded student activities.</p>
            </div>
            <span className="count-badge">
              {activities.length} records
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state">
              <span>📝</span>
              <h3>No activities yet</h3>
              <p>Add your first student activity using the form.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Activity</th>
                    <th>Hours</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {activities.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="student-cell">
                          <span className="avatar">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                          <span>{item.name}</span>
                        </div>
                      </td>

                      <td>{item.activity}</td>

                      <td>
                        <span className="hours-badge">
                          {item.hours} h
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            type="button"
                            onClick={() => handleEdit(item)}
                            disabled={actionLoading || loading}
                            title="Edit activity"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            className="delete-button"
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={actionLoading || loading}
                            title="Delete activity"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      <footer>
        Student Activity Tracker <span>•</span> Built with React and FastAPI
      </footer>
    </main>
  )
}

export default App
