const db = require('../config/db');

exports.getTasks = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
};

exports.createTask = async (req, res) => {
  const { title, description, status } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const validStatuses = ['pending', 'in progress', 'completed'];
  const taskStatus = validStatuses.includes(status) ? status : 'pending';

  try {
    const [result] = await db.execute(
      'INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)',
      [req.userId, title, description || null, taskStatus]
    );
    const [newTask] = await db.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  try {
    const [task] = await db.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (task.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const validStatuses = ['pending', 'in progress', 'completed'];
    const taskStatus = validStatuses.includes(status) ? status : task[0].status;

    await db.execute(
      'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
      [title || task[0].title, description || task[0].description, taskStatus, id]
    );
    const [updated] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error deleting task' });
  }
};