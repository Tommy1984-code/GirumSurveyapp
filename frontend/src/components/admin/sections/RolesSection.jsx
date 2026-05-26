import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ClipLoader from 'react-spinners/ClipLoader';

export default function RolesSection({
  roles,
  loadingRoles,
  allModules,
  onAddRole,
  onToggleRolePermission,
  onDeleteRole
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-gray-500 mt-1">Manage roles and module access</p>
        </div>
        <button
          onClick={onAddRole}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loadingRoles ? (
          <div className="flex justify-center py-16">
            <ClipLoader size={40} color="#3B82F6" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{role.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {allModules.map(mod => (
                          <button
                            key={mod}
                            onClick={() => onToggleRolePermission(role.id, mod)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              role.permissions.includes(mod)
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {mod}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {role.name !== 'Super Admin' && (
                          <button
                            onClick={() => onDeleteRole(role)}
                            className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-500"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
