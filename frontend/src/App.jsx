import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Circle, Trash2, BookOpen, Clock, Calendar, PlusCircle } from 'lucide-react';
import './App.css';

const API_BASE = '/api/tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [hours, setHours] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_BASE);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim() || !hours) return;

    try {
      const res = await axios.post(API_BASE, {
        subject: subject.trim(),
        topic: topic.trim(),
        hours: parseFloat(hours),
        deadline: deadline || ''
      });
      setTasks([res.data, ...tasks]);
      setSubject('');
      setTopic('');
      setHours('');
      setDeadline('');
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const toggleTask = async (id) => {
    try {
      const res = await axios.patch(`${API_BASE}/${id}/toggle`);
      setTasks(tasks.map(t => (t.id === id ? { ...t, completed: res.data.completed } : t)));
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
  const completedHours = tasks
    .filter(t => t.completed === 1)
    .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
  const progressPct = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  return (
    <div className="planner-container">
      <header className="planner-header">
        <h1><BookOpen className="inline-icon" /> Daily Study Planner</h1>
        <p>Plan, track, and master your study sessions</p>
      </header>

      {/* Progress Dashboard */}
      <section className="dashboard-grid">
        <div className="metric-card">
          <span className="metric-label">Total Tasks</span>
          <span className="metric-val">{tasks.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Planned Hours</span>
          <span className="metric-val">{totalHours.toFixed(1)} hrs</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Completed Hours</span>
          <span className="metric-val">{completedHours.toFixed(1)} hrs</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Progress</span>
          <span className="metric-val">{progressPct}%</span>
        </div>
      </section>

      {/* Task Creation Form */}
      <form className="task-form" onSubmit={handleAddTask}>
        <h2>Add Study Session</h2>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Subject (e.g. Operating Systems)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Topic (e.g. Memory Management)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
          <input
            type="number"
            step="0.5"
            min="0.5"
            placeholder="Duration (Hours)"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-add">
          <PlusCircle size={18} /> Schedule Task
        </button>
      </form>

      {/* Task List */}
      <section className="task-section">
        <h2>Your Study Schedule</h2>
        {loading ? (
          <p className="empty-msg">Loading tasks from database...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-msg">No study tasks added yet. Add one above to get started!</p>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                <button className="check-btn" onClick={() => toggleTask(task.id)}>
                  {task.completed ? (
                    <CheckCircle2 className="icon-done" size={24} />
                  ) : (
                    <Circle className="icon-pending" size={24} />
                  )}
                </button>
                <div className="task-info">
                  <div className="task-title-row">
                    <span className="task-subject">{task.subject}</span>
                    <span className="task-topic">{task.topic}</span>
                  </div>
                  <div className="task-meta">
                    <span><Clock size={14} /> {task.hours} hrs</span>
                    {task.deadline && (
                      <span><Calendar size={14} /> {task.deadline}</span>
                    )}
                  </div>
                </div>
                <button className="delete-btn" onClick={() => deleteTask(task.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}