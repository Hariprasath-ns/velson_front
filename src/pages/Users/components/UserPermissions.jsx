import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NAV } from '../../../config/nav';
import * as userService from '../services/userService';
import { useToast } from '../../../components/Toast';
import { ROLES } from '../utils/userConstants';

// Flatten the NAV configuration to extract list of configureable modules
const getModulesFromNav = () => {
  const list = [];
  NAV.forEach((item) => {
    // Determine parent name
    let parentName = item.label;
    if (parentName === "Masters") parentName = "Master";
    if (parentName === "Account") parentName = "Accounts";
    if (parentName === "Maintainance") parentName = "Maintenance";

    if (item.children && item.children.length > 0) {
      item.children.forEach((child) => {
        list.push({
          id: child.id,
          name: child.label,
          parent: parentName,
        });
      });
    } else {
      list.push({
        id: item.id.replace(/-top$/, ""),
        name: item.label,
        parent: parentName,
      });
    }
  });
  return list;
};

const MODULE_LIST = getModulesFromNav();

// Extract unique parent categories for the module filter dropdown
const PARENT_CATEGORIES = Array.from(new Set(MODULE_LIST.map((m) => m.parent))).sort();

export default function UserPermissions({ selectedUserFromTable, onClearSelectedUser }) {
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState({});

  // Master header checkbox states
  const [masterDisplay, setMasterDisplay] = useState(false);
  const [masterSave, setMasterSave] = useState(false);
  const [masterEdit, setMasterEdit] = useState(false);
  const [masterDelete, setMasterDelete] = useState(false);
  const [masterPrint, setMasterPrint] = useState(false);

  // Sync with user selected from the Users table
  useEffect(() => {
    if (selectedUserFromTable) {
      setSelectedRole(selectedUserFromTable.role);
      onClearSelectedUser(); // Clear after setting
    }
  }, [selectedUserFromTable, onClearSelectedUser]);

  // Load permissions when selected role changes
  const loadRolePermissions = useCallback(async (role) => {
    if (!role) {
      setPermissions({});
      return;
    }
    setLoading(true);
    try {
      const response = await userService.getRolePermissions(role);
      const dbPerms = response.data?.data || [];
      
      // Build a map of { [moduleId]: { canDisplay, canSave, canEdit, canDelete, canPrint } }
      const permMap = {};
      MODULE_LIST.forEach((m) => {
        const found = dbPerms.find((p) => p.module === m.id);
        permMap[m.id] = {
          canDisplay: found ? !!found.canDisplay : false,
          canSave: found ? !!found.canSave : false,
          canEdit: found ? !!found.canEdit : false,
          canDelete: found ? !!found.canDelete : false,
          canPrint: found ? !!found.canPrint : false,
        };
      });
      setPermissions(permMap);
      
      // Reset master checkboxes
      setMasterDisplay(false);
      setMasterSave(false);
      setMasterEdit(false);
      setMasterDelete(false);
      setMasterPrint(false);
    } catch (err) {
      console.error('[UserPermissions] loadRolePermissions error:', err);
      toast.error('Failed to load role permissions');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRolePermissions(selectedRole);
  }, [selectedRole, loadRolePermissions]);

  // Filter modules to display
  const filteredModules = useMemo(() => {
    if (!filterModule) return MODULE_LIST;
    return MODULE_LIST.filter((m) => m.parent === filterModule);
  }, [filterModule]);

  // Handle individual checkbox changes
  const handleCheckboxChange = (moduleId, field, value) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }));
  };

  // Master column toggle: updates the specific field for all currently visible rows
  const handleMasterToggle = (field, checked, setMasterState) => {
    setMasterState(checked);
    setPermissions((prev) => {
      const updated = { ...prev };
      filteredModules.forEach((m) => {
        if (!updated[m.id]) {
          updated[m.id] = {
            canDisplay: false,
            canSave: false,
            canEdit: false,
            canDelete: false,
            canPrint: false,
          };
        }
        updated[m.id][field] = checked;
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) {
      toast.warning('Please select a role first.');
      return;
    }
    setSaving(true);
    try {
      // Convert permissions map to array of database payloads
      const payload = Object.entries(permissions).map(([moduleId, flags]) => ({
        module: moduleId,
        canDisplay: flags.canDisplay,
        canSave: flags.canSave,
        canEdit: flags.canEdit,
        canDelete: flags.canDelete,
        canPrint: flags.canPrint,
      }));

      await userService.updateRolePermissions(selectedRole, payload);
      toast.success('Role rights assigned and saved successfully.');
    } catch (err) {
      console.error('[UserPermissions] save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const inp = "border border-slate-200 rounded px-2.5 py-1.5 text-[13px] text-slate-800 outline-none focus:border-[#0097A7] bg-white shadow-sm min-w-[180px]";

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 relative">
      {/* Selection Filters Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded border border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">Role Rights :</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={inp}
            >
              <option value="">-- Select Role --</option>
              {Object.values(ROLES).filter(r => r !== ROLES.ADMIN).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">Module :</span>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className={inp}
            >
              <option value="">-- All Modules --</option>
              {PARENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadRolePermissions(selectedRole)}
            className="px-4 py-1.5 bg-[#475569] hover:bg-slate-700 text-white text-[13px] font-bold rounded shadow-sm transition-colors"
          >
            Show
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !selectedRole}
            className="px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded shadow-sm transition-colors disabled:opacity-40 disabled:hover:bg-[#0097A7]"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Master toggles aligned to the right */}
        {selectedRole && (
          <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm text-[12px] font-semibold text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={masterDisplay}
                onChange={(e) => handleMasterToggle('canDisplay', e.target.checked, setMasterDisplay)}
                className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7]"
              />
              Display
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={masterSave}
                onChange={(e) => handleMasterToggle('canSave', e.target.checked, setMasterSave)}
                className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7]"
              />
              Save
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={masterEdit}
                onChange={(e) => handleMasterToggle('canEdit', e.target.checked, setMasterEdit)}
                className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7]"
              />
              Edit
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={masterDelete}
                onChange={(e) => handleMasterToggle('canDelete', e.target.checked, setMasterDelete)}
                className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7]"
              />
              Delete
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={masterPrint}
                onChange={(e) => handleMasterToggle('canPrint', e.target.checked, setMasterPrint)}
                className="rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7]"
              />
              Print
            </label>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0097A7]"></div>
          <span className="ml-3 text-[14px] text-slate-500 font-semibold">Loading role permissions...</span>
        </div>
      ) : !selectedRole ? (
        <div className="text-center py-20 text-slate-400 font-medium border border-dashed border-slate-200 rounded-lg">
          Please select a non-admin role from the dropdown above to manage its access rights.
        </div>
      ) : (
        /* Permissions Matrix Table */
        <div className="border border-slate-200 rounded overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full text-[13px] table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th style={{ width: '20%' }} className="px-4 py-2.5 font-bold text-slate-700 text-left">Parent</th>
                  <th style={{ width: '30%' }} className="px-4 py-2.5 font-bold text-slate-700 text-left">Menu_Name</th>
                  <th style={{ width: '10%' }} className="px-4 py-2.5 font-bold text-slate-700 text-center">Display</th>
                  <th style={{ width: '10%' }} className="px-4 py-2.5 font-bold text-slate-700 text-center">Save</th>
                  <th style={{ width: '10%' }} className="px-4 py-2.5 font-bold text-slate-700 text-center">Edit</th>
                  <th style={{ width: '10%' }} className="px-4 py-2.5 font-bold text-slate-700 text-center">Delete</th>
                  <th style={{ width: '10%' }} className="px-4 py-2.5 font-bold text-slate-700 text-center">Print</th>
                </tr>
              </thead>
              <tbody>
                {filteredModules.map((m, idx) => {
                  const perm = permissions[m.id] || {
                    canDisplay: false,
                    canSave: false,
                    canEdit: false,
                    canDelete: false,
                    canPrint: false,
                  };

                  return (
                    <tr
                       key={m.id}
                       className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors
                        ${idx % 2 === 1 ? 'bg-slate-50/20' : ''}`}
                    >
                      <td className="px-4 py-2 font-medium text-slate-500 text-left">{m.parent}</td>
                      <td className="px-4 py-2 font-bold text-slate-800 text-left">{m.name}</td>
                      
                      {/* Checkboxes */}
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canDisplay}
                          onChange={(e) => handleCheckboxChange(m.id, 'canDisplay', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canSave}
                          onChange={(e) => handleCheckboxChange(m.id, 'canSave', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canEdit}
                          onChange={(e) => handleCheckboxChange(m.id, 'canEdit', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canDelete}
                          onChange={(e) => handleCheckboxChange(m.id, 'canDelete', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={perm.canPrint}
                          onChange={(e) => handleCheckboxChange(m.id, 'canPrint', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
