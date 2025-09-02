// components/admin-users.tsx
"use client"

import useSWR from "swr"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminUsers() {
  const { data, mutate } = useSWR("/api/admin/users", fetcher)
  const [saving, setSaving] = useState<string | null>(null)
  const users = data?.users || []

  async function changeRole(id: string, role: "user" | "admin") {
    setSaving(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (res.ok) mutate()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="border border-white/20">
      <div className="p-3 border-b border-white/10">
        <h3 className="text-lg font-semibold">User Management</h3>
        <p className="text-sm text-white/60">Promote/demote users and manage roles.</p>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/40">
            <tr className="[&>th]:px-3 [&>th]:py-2 border-b border-white/10">
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u._id} className="[&>td]:px-3 [&>td]:py-2 border-b border-white/10">
                <td>{u.email}</td>
                <td className="capitalize">{u.role}</td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                <td className="flex gap-2">
                  <button
                    className="border border-white px-2 py-1 disabled:opacity-50"
                    disabled={saving === u._id || u.role === "admin"}
                    onClick={() => changeRole(u._id, "admin")}
                  >
                    Make Admin
                  </button>
                  <button
                    className="border border-white px-2 py-1 disabled:opacity-50"
                    disabled={saving === u._id || u.role === "user"}
                    onClick={() => changeRole(u._id, "user")}
                  >
                    Make User
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-white/60" colSpan={4}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
