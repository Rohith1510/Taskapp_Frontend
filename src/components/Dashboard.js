import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard({ session }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: '', status: 'incomplete' });
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ status: '', due: '' });

  // Fetch tasks from backend
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.due) params.append('due', filters.due);
      const res = await fetch(`${API_URL}/tasks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
        setError(data.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      toast.error('Failed to fetch tasks');
    }
    setLoading(false);
  };

  // Create or update task
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/tasks/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Failed to update task');
        toast.success('Task updated');
      } else {
        res = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Failed to create task');
        toast.success('Task created');
      }
      setForm({ title: '', description: '', due_date: '', priority: '', status: 'incomplete' });
      setEditingId(null);
      fetchTasks();
    } catch (err) {
      setError(editingId ? 'Failed to update task' : 'Failed to create task');
      toast.error(editingId ? 'Failed to update task' : 'Failed to create task');
    }
  };

  // Edit task
  const handleEdit = (task) => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      priority: task.priority || '',
      status: task.status || 'incomplete',
    });
    setEditingId(task.id);
  };

  // Delete task
  const handleDelete = async (id) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete task');
      fetchTasks();
      toast.success('Task deleted');
    } catch (err) {
      setError('Failed to delete task');
      toast.error('Failed to delete task');
    }
  };

  // Share task
  const handleShare = async (id) => {
    const email = prompt('Enter the email of the user to share with:');
    if (!email) return;
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tasks/${id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to share task');
      fetchTasks();
      toast.success('Task shared');
    } catch (err) {
      setError('Failed to share task');
      toast.error('Failed to share task');
    }
  };

  useEffect(() => {
    fetchTasks();
    // WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:5000');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'TASK_UPDATE') {
        fetchTasks();
      }
    };
    return () => ws.close();
  }, [filters]);

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div>
      <ToastContainer />
      <h2>Dashboard</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {/* Filters */}
      <div style={{ marginBottom: 20 }}>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="incomplete">Incomplete</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
        <select value={filters.due} onChange={e => setFilters(f => ({ ...f, due: e.target.value }))} style={{ marginLeft: 8 }}>
          <option value="">All Dates</option>
          <option value="today">Due Today</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      {/* Form and task list remain unchanged */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="date"
          value={form.due_date}
          onChange={e => setForm({ ...form, due_date: e.target.value })}
        />
        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          <option value="">Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="incomplete">Incomplete</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
        <button type="submit">{editingId ? 'Update' : 'Add'} Task</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '', due_date: '', priority: '', status: 'incomplete' }); }}>Cancel</button>}
      </form>
      <ul>
        {(Array.isArray(tasks) ? tasks : []).map(task => (
          <li key={task.id}>
            {task.title} - {task.status}
            <button onClick={() => handleEdit(task)} style={{ marginLeft: 8 }}>Edit</button>
            <button onClick={() => handleDelete(task.id)} style={{ marginLeft: 4 }}>Delete</button>
            <button onClick={() => handleShare(task.id)} style={{ marginLeft: 4 }}>Share</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard; 