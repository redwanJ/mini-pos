import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Users, Plus, Edit, Trash2, X, Check } from 'lucide-react';
import type { StaffMember } from '../types';
import { generateId } from '../utils/helpers';
import { addStaff, updateStaff as dbUpdateStaff, deleteStaff } from '../lib/db';

export default function Staff() {
  const { staff, loadStaff, currentStaff, setCurrentStaff } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const handleAddStaff = () => {
    setEditingStaff(null);
    setShowForm(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setShowForm(true);
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      await deleteStaff(id);
      await loadStaff();
      if (currentStaff?.id === id) {
        setCurrentStaff(undefined as any);
      }
    }
  };

  const handleSetActive = (member: StaffMember) => {
    setCurrentStaff(member);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-gray-900"
        >
          Staff Management
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddStaff}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Staff
        </motion.button>
      </div>

      {/* Current Staff */}
      {currentStaff && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <p className="text-sm opacity-90 mb-2">Current User</p>
          <h2 className="text-2xl font-bold">{currentStaff.name}</h2>
          <p className="opacity-90 mt-1 capitalize">{currentStaff.role}</p>
        </motion.div>
      )}

      {/* Staff List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {staff.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-2xl p-4 shadow-lg border-2 ${
                currentStaff?.id === member.id
                  ? 'border-purple-500'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                    {currentStaff?.id === member.id && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                </div>
                <div className="flex gap-2">
                  {currentStaff?.id !== member.id && (
                    <button
                      onClick={() => handleSetActive(member)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditStaff(member)}
                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(member.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Permissions</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(member.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          value ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-gray-700">
                        {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {staff.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-12 text-center shadow-lg"
        >
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No staff members</h3>
          <p className="text-gray-600">Add staff members to manage access</p>
        </motion.div>
      )}

      {/* Staff Form Modal */}
      <AnimatePresence>
        {showForm && (
          <StaffForm
            member={editingStaff}
            onClose={() => setShowForm(false)}
            onSave={async (member) => {
              if (editingStaff) {
                await dbUpdateStaff(member);
              } else {
                await addStaff(member);
              }
              await loadStaff();
              setShowForm(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StaffForm({
  member,
  onClose,
  onSave,
}: {
  member: StaffMember | null;
  onClose: () => void;
  onSave: (member: StaffMember) => void;
}) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    role: member?.role || 'staff' as 'owner' | 'staff',
    permissions: member?.permissions || {
      canAddProducts: true,
      canEditProducts: true,
      canDeleteProducts: false,
      canViewReports: true,
      canManageStaff: false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: StaffMember = {
      id: member?.id || generateId('staff-'),
      name: formData.name,
      role: formData.role,
      permissions: formData.permissions,
      createdAt: member?.createdAt || Date.now(),
    };
    onSave(newMember);
  };

  const togglePermission = (key: keyof typeof formData.permissions) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key],
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {member ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'owner' | 'staff' })}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions
            </label>
            <div className="space-y-2">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => togglePermission(key as keyof typeof formData.permissions)}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">
                    {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
            >
              {member ? 'Update' : 'Add'} Staff
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
