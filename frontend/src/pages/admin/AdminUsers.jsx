import { useState } from 'react';
import { useAdminUsers, useUpdateUserStatus, useUpdateUserRole } from '../../lib/adminQueries.js';
import { Skeleton, ErrorState, Badge } from '../../components/ui/Surfaces.jsx';
import Pagination from '../../components/ui/Pagination.jsx';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useAdminUsers({ search: search || undefined, page });
  const { mutate: setStatus } = useUpdateUserStatus();
  const { mutate: setRole } = useUpdateUserRole();

  return (
    <div>
      <input
        className="input mb-4 max-w-xs"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />

      {isLoading && <Skeleton className="h-96 w-full" />}
      {isError && <ErrorState description="Couldn't load users." onRetry={refetch} />}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border dark:border-indigo-800">
          <table className="w-full text-sm">
            <thead className="bg-ivory dark:bg-indigo-950 text-left text-xs uppercase tracking-wide text-muted dark:text-indigo-300">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u._id} className="border-t border-border dark:border-indigo-800">
                  <td className="px-4 py-3 font-medium text-indigo-900 dark:text-ivory">{u.name}</td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input py-1 text-xs"
                      value={u.role}
                      onChange={(e) => setRole({ id: u._id, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      className="btn-ghost text-xs"
                      disabled={u.role === 'admin' && u.isActive}
                      onClick={() => setStatus({ id: u._id, isActive: !u.isActive })}
                    >
                      {u.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3">
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
