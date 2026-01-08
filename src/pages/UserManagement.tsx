import { useState } from 'react';
import {
  Users, Clock, Check, X, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, StatusBadge, Select } from '../components';
import { Modal } from '../components/Modal';
import {
  useUserManagement, useAppDispatch, usePermission, useAuth
} from '../state';
import { Permission, Role } from '../types';
import { ALL_PERMISSIONS } from '../constants';

export function UserManagement() {
  const { users, usersByStatus, permissionRequests, pendingRequests } = useUserManagement();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermission();
  const { user: currentUser } = useAuth();

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [denyModal, setDenyModal] = useState<{ requestId: string; userName: string } | null>(null);
  const [denyNotes, setDenyNotes] = useState('');

  // Check permission
  if (!hasPermission('users.manage')) {
    return (
      <PageTemplate title="Access Denied">
        <Card>
          <div className="text-center py-8">
            <Shield size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-red-400 font-mono">
              You don't have permission to access this page.
            </p>
          </div>
        </Card>
      </PageTemplate>
    );
  }

  const pendingUsers = usersByStatus.pending.map(id => users[id]).filter(Boolean);
  const allUsers = Object.values(users);

  const handleApproveUser = (userId: string) => {
    dispatch({ type: 'USER_APPROVE', payload: userId });
  };

  const handleBlockUser = (userId: string) => {
    dispatch({ type: 'USER_BLOCK', payload: userId });
  };

  const handleUpdateStatus = (userId: string, status: 'active' | 'blocked') => {
    dispatch({ type: 'USER_UPDATE_STATUS', payload: { userId, status } });
  };

  const handleUpdateRole = (userId: string, role: Role) => {
    dispatch({ type: 'USER_UPDATE_ROLE', payload: { userId, role } });
  };

  const handleTogglePermission = (userId: string, permission: Permission, enabled: boolean) => {
    dispatch({ type: 'USER_UPDATE_PERMISSIONS', payload: { userId, permission, enabled } });
  };

  const handleApproveRequest = (requestId: string) => {
    dispatch({ type: 'PERMISSION_REQUEST_APPROVE', payload: { requestId, reviewNotes: '' } });
  };

  const handleDenyRequest = () => {
    if (!denyModal) return;
    dispatch({
      type: 'PERMISSION_REQUEST_DENY',
      payload: { requestId: denyModal.requestId, reviewNotes: denyNotes }
    });
    setDenyModal(null);
    setDenyNotes('');
  };

  const roleOptions = [
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'Staff' },
  ];

  return (
    <PageTemplate title="User Management">
      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <Card title="Pending Approvals" icon={Clock} variant="warning">
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div
                key={user.id}
                className="
                  flex items-center justify-between
                  p-4
                  bg-amber-500/5
                  border border-amber-500/20
                  rounded-lg
                "
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-mono text-emerald-100">{user.name}</div>
                    <div className="text-slate-500 text-xs font-mono">{user.email}</div>
                    <div className="text-slate-600 text-xs font-mono mt-0.5">
                      Registered: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Check}
                    onClick={() => handleApproveUser(user.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={X}
                    onClick={() => handleBlockUser(user.id)}
                  >
                    Block
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Permission Requests */}
      {pendingRequests.length > 0 && (
        <Card title="Permission Requests" icon={Shield}>
          <div className="space-y-3">
            {pendingRequests.map(requestId => {
              const request = permissionRequests[requestId];
              if (!request) return null;
              const requestUser = users[request.userId];
              if (!requestUser) return null;

              return (
                <div
                  key={requestId}
                  className="
                    p-4
                    bg-slate-800/30
                    border border-slate-700
                    rounded-lg
                  "
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={requestUser.avatar}
                        alt={requestUser.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-mono text-emerald-100">{requestUser.name}</div>
                        <div className="text-amber-400 text-sm font-mono">
                          Requesting: {request.permission}
                        </div>
                        <div className="text-slate-500 text-xs font-mono mt-1">
                          Reason: {request.reason}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Check}
                        onClick={() => handleApproveRequest(requestId)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={X}
                        onClick={() => setDenyModal({ requestId, userName: requestUser.name })}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* All Users Table */}
      <Card title="All Users" icon={Users}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-emerald-400 font-mono text-xs uppercase">User</th>
                <th className="text-left py-3 px-4 text-emerald-400 font-mono text-xs uppercase">Role</th>
                <th className="text-left py-3 px-4 text-emerald-400 font-mono text-xs uppercase">Status</th>
                <th className="text-left py-3 px-4 text-emerald-400 font-mono text-xs uppercase">Permissions</th>
                <th className="text-left py-3 px-4 text-emerald-400 font-mono text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(user => {
                const isExpanded = expandedUserId === user.id;
                const isCurrentUser = user.id === currentUser?.id;

                return (
                  <>
                    <tr
                      key={user.id}
                      className="border-b border-slate-800"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="font-mono text-emerald-100">{user.name}</div>
                            <div className="text-slate-500 text-xs font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={user.role}
                          onChange={(role) => handleUpdateRole(user.id, role as Role)}
                          options={roleOptions}
                          disabled={isCurrentUser}
                          className="w-32"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                          className="
                            flex items-center gap-2
                            text-sm font-mono text-slate-400
                            hover:text-emerald-400
                            transition-colors
                          "
                        >
                          {user.permissions.length} permissions
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {user.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleUpdateStatus(user.id, 'active')}
                            >
                              Approve
                            </Button>
                          )}
                          {user.status === 'active' && !isCurrentUser && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleUpdateStatus(user.id, 'blocked')}
                            >
                              Block
                            </Button>
                          )}
                          {user.status === 'blocked' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleUpdateStatus(user.id, 'active')}
                            >
                              Unblock
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Permissions Row */}
                    {isExpanded && (
                      <tr key={`${user.id}-perms`}>
                        <td colSpan={5} className="bg-slate-950 p-4">
                          <PermissionCheckboxGrid
                            permissions={user.permissions}
                            onToggle={(permission, enabled) =>
                              handleTogglePermission(user.id, permission, enabled)
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Deny Modal */}
      <Modal
        isOpen={!!denyModal}
        onClose={() => setDenyModal(null)}
        title="Deny Permission Request"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-300 font-mono">
            Denying request from <span className="text-emerald-400">{denyModal?.userName}</span>
          </p>

          <div>
            <label className="text-sm font-mono text-slate-400 uppercase tracking-wide mb-1.5 block">
              Reason (optional)
            </label>
            <textarea
              value={denyNotes}
              onChange={(e) => setDenyNotes(e.target.value)}
              placeholder="Why is this request being denied?"
              className="
                w-full
                bg-slate-800/50
                border border-slate-700
                rounded-lg
                px-4 py-2.5
                font-mono text-slate-200
                placeholder:text-slate-600
                focus:outline-none focus:border-emerald-500/50
                resize-none
              "
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDenyModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDenyRequest}>
              Deny Request
            </Button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}

// Permission Checkbox Grid Component
function PermissionCheckboxGrid({
  permissions,
  onToggle,
}: {
  permissions: Permission[];
  onToggle: (permission: Permission, enabled: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {ALL_PERMISSIONS.map(group => (
        <div key={group.category}>
          <h4 className="text-emerald-400 font-mono text-sm mb-2">{group.category}</h4>
          <div className="space-y-1">
            {group.perms.map(perm => (
              <label
                key={perm}
                className="flex items-center gap-2 text-sm text-slate-300 py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={permissions.includes(perm)}
                  onChange={(e) => onToggle(perm, e.target.checked)}
                  className="
                    rounded
                    bg-slate-800
                    border-slate-600
                    text-emerald-500
                    focus:ring-emerald-500/30
                    cursor-pointer
                  "
                />
                <span className="font-mono text-xs">
                  {perm.split('.')[1]}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
