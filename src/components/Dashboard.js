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

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
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

  if (loading) return <div className="min-h-screen flex items-center justify-center animated-gradient-bg">Loading tasks...</div>;

  return (
    <div className="min-h-screen w-full animated-gradient-bg flex flex-col">
      {/* Navbar */}
      <nav className="w-full py-4 px-6 md:px-12 flex items-center justify-between bg-black/30 backdrop-blur-md shadow-sm">
        <span className="flex items-center gap-2">
          <img src="/check.png" alt="Logo" className="w-7 h-7 md:w-8 md:h-8" />
          <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Task Management App</span>
        </span>
        <button onClick={logout} className="text-sm font-medium text-blue-300 hover:underline">Logout</button>
      </nav>
      {/* Main Card */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 md:p-10 gradient-border border border-transparent animate-fade-in">
          <ToastContainer />
          <h2 className="text-2xl font-bold mb-4 text-center text-black">Dashboard</h2>
          {error && <div className="text-red-400 text-center mb-2">{error}</div>}
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 items-center justify-center">
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="rounded-lg border border-gray-700 px-3 py-2 bg-white/20 text-black focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All Statuses</option>
              <option value="incomplete">Incomplete</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
            <select value={filters.due} onChange={e => setFilters(f => ({ ...f, due: e.target.value }))} className="rounded-lg border border-gray-700 px-3 py-2 bg-white/20 text-black focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">All Dates</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mb-6 items-center justify-center">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              className="rounded-lg border border-gray-700 px-3 py-2 bg-white/20 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-32"
            />
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border border-gray-700 px-3 py-2 bg-white/20 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-40"
            />
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              className="rounded-lg border border-gray-700 px-3 py-2 bg-white/20 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-36"
            />
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="rounded-lg border border-gray-700 px-3 py-2 bg-white/20 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-28">
              <option value="">Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="rounded-lg border border-gray-700 px-3 py-2 bg-white/20 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-32">
              <option value="incomplete">Incomplete</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
            <button type="submit" className="rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold shadow hover:bg-blue-700 transition">{editingId ? 'Update' : 'Add'} Task</button>
          </form>
          {/* Task List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className="transition transform hover:scale-105 hover:bg-gradient-to-tr hover:from-pink-400/30 hover:to-cyan-400/30 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-transparent gradient-border animate-fade-in flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg text-black">{task.title}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-900/10 text-blue-900 capitalize">{task.status.replace('_', ' ')}</span>
                </div>
                <div className="text-gray-800 text-sm mb-2">{task.description}</div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-700 mb-2">
                  {task.due_date && <span>Due: {task.due_date}</span>}
                  {task.priority && <span>Priority: {task.priority}</span>}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => handleEdit(task)} className="rounded bg-yellow-500 text-white px-3 py-1 text-xs font-semibold shadow hover:bg-yellow-600 transition">Edit</button>
                  <button onClick={() => handleDelete(task.id)} className="rounded bg-red-600 text-white px-3 py-1 text-xs font-semibold shadow hover:bg-red-700 transition">Delete</button>
                  <button onClick={() => handleShare(task.id)} className="rounded bg-green-600 text-white px-3 py-1 text-xs font-semibold shadow hover:bg-green-700 transition">Share</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 