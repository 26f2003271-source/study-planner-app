const path = require("path");
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();


const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'planner.db'), (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log('Connected to SQLite database.');
});

// Create tasks table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      hours REAL NOT NULL,
      deadline TEXT,
      completed INTEGER DEFAULT 0
    )
  `);
});

// GET all study tasks
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY completed ASC, id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST a new study task
app.post('/api/tasks', (req, res) => {
  const { subject, topic, hours, deadline } = req.body;
  if (!subject || !topic || !hours) {
    return res.status(400).json({ error: 'Subject, topic, and hours are required.' });
  }

  const sql = `INSERT INTO tasks (subject, topic, hours, deadline) VALUES (?, ?, ?, ?)`;
  db.run(sql, [subject, topic, hours, deadline || ''], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, subject, topic, hours, deadline, completed: 0 });
  });
});

// PATCH toggle task completed status
app.patch('/api/tasks/:id/toggle', (req, res) => {
  const { id } = req.params;
  db.get('SELECT completed FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Task not found' });

    const newStatus = row.completed === 1 ? 0 : 1;
    db.run('UPDATE tasks SET completed = ? WHERE id = ?', [newStatus, id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ id: Number(id), completed: newStatus });
    });
  });
});

// DELETE a study task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Task deleted successfully', deletedId: id });
  });
});

app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.use( (req, res) => res.sendFile(path.join(__dirname, "../frontend/dist", "index.html")));

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});