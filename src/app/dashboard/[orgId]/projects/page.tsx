"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, FolderOpen, Archive, CheckCircle, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
}

const statusIcons = {
  ACTIVE: <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />,
  ARCHIVED: <Archive className="h-3 w-3 text-gray-400" />,
  COMPLETED: <CheckCircle className="h-3 w-3 text-blue-500" />,
};

export default function ProjectsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/organizations/${orgId}/projects`)
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [orgId]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    const res = await fetch(`/api/organizations/${orgId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setProjects((p) => [data, ...p]);
      setShowForm(false);
      setForm({ name: "", description: "" });
    }
    setCreating(false);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="font-semibold mb-4">New Project</h3>
          <form onSubmit={createProject} className="space-y-4">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Project name"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Project
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No projects yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl border p-5 hover:shadow-sm transition">
              <div className="flex items-center gap-2 mb-2">
                {statusIcons[project.status as keyof typeof statusIcons]}
                <span className="text-xs text-gray-500 capitalize">{project.status.toLowerCase()}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
