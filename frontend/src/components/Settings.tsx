import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Building2, Users, Bell, Shield, Twitter } from 'lucide-react';
import { DEFAULT_ACTIVE_ROLES, JobRole } from '../config/roles';
import { TwitterAuth } from './TwitterAuth';

export function Settings() {
    const [activeSection, setActiveSection] = useState('roles');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState<JobRole | null>(null);
    const [roles, setRoles] = useState<JobRole[]>(DEFAULT_ACTIVE_ROLES);

    const [formData, setFormData] = useState<JobRole>({
        id: '',
        title: '',
        department: '',
        location: '',
        type: 'Full-time',
        description: '',
        requirements: [],
        salary: '',
        status: 'active',
    });
    const [newRequirement, setNewRequirement] = useState('');

    const handleAddRole = () => {
        setEditingRole(null);
        setFormData({
            id: '',
            title: '',
            department: '',
            location: '',
            type: 'Full-time',
            description: '',
            requirements: [],
            salary: '',
            status: 'active',
        });
        setNewRequirement('');
        setShowRoleModal(true);
    };

    const handleEditRole = (role: JobRole) => {
        setEditingRole(role);
        setFormData(role);
        setNewRequirement('');
        setShowRoleModal(true);
    };

    const handleDeleteRole = (id: string) => {
        if (confirm('Are you sure you want to delete this role?')) {
            setRoles(roles.filter((r) => r.id !== id));
        }
    };

    const handleSaveRole = () => {
        if (!formData.title || !formData.department) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingRole) {
            setRoles(roles.map((r) => (r.id === editingRole.id ? formData : r)));
        } else {
            const newRole = { ...formData, id: Date.now().toString() };
            setRoles([...roles, newRole]);
        }

        setShowRoleModal(false);
    };

    const handleAddRequirement = () => {
        if (newRequirement.trim()) {
            setFormData({
                ...formData,
                requirements: [...formData.requirements, newRequirement.trim()],
            });
            setNewRequirement('');
        }
    };

    const handleRemoveRequirement = (index: number) => {
        setFormData({
            ...formData,
            requirements: formData.requirements.filter((_, i) => i !== index),
        });
    };

    const sections = [
        { id: 'roles', name: 'Job Roles', icon: Users },
        { id: 'integrations', name: 'Integrations', icon: Twitter },
        { id: 'company', name: 'Company Info', icon: Building2 },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10">
                <div className="p-6">
                    <h1 className="text-2xl mb-1">Settings</h1>
                    <p className="text-sm text-gray-500">Manage your recruiting preferences and job postings</p>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 px-6 pb-4 overflow-x-auto">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeSection === section.id
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
                                }`}
                        >
                            <section.icon className="w-4 h-4" />
                            <span className="text-sm">{section.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeSection === 'roles' && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl mb-1">Active Job Roles</h2>
                                <p className="text-sm text-gray-500">{roles.length} positions currently hiring</p>
                            </div>
                            <button
                                onClick={handleAddRole}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Role
                            </button>
                        </div>

                        {/* Roles Grid */}
                        <div className="grid gap-4">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg">{role.title}</h3>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs ${role.status === 'active'
                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                            : role.status === 'paused'
                                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                        }`}
                                                >
                                                    {role.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
                                                <span>{role.department}</span>
                                                <span>•</span>
                                                <span>{role.location}</span>
                                                <span>•</span>
                                                <span>{role.type}</span>
                                                <span>•</span>
                                                <span className="text-blue-400">{role.salary}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 mb-3">{role.description}</p>

                                            {/* Requirements */}
                                            <div className="mb-2">
                                                <p className="text-xs text-gray-500 mb-2">Requirements:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {role.requirements.map((req, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-lg border border-gray-700/50"
                                                        >
                                                            {req}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEditRole(role)}
                                                className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-all"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRole(role.id)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'integrations' && (
                    <div className="p-6">
                        <h2 className="text-xl mb-2">Integrations</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Connect external services to enhance your recruiting workflow
                        </p>

                        <TwitterAuth
                            onAuthSuccess={(token, username) => {
                                console.log('Twitter authenticated:', username);
                            }}
                        />
                    </div>
                )}

                {activeSection === 'company' && (
                    <div className="p-6">
                        <h2 className="text-xl mb-6">Company Information</h2>
                        <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800/50 rounded-xl p-6 max-w-2xl">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        defaultValue="Acme Inc."
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Industry</label>
                                    <input
                                        type="text"
                                        defaultValue="Technology"
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Company Size</label>
                                    <select className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors">
                                        <option>1-10 employees</option>
                                        <option>11-50 employees</option>
                                        <option selected>51-200 employees</option>
                                        <option>201-500 employees</option>
                                        <option>500+ employees</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Website</label>
                                    <input
                                        type="url"
                                        defaultValue="https://acme.com"
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Description</label>
                                    <textarea
                                        rows={4}
                                        defaultValue="We build innovative software solutions for modern businesses."
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                                    />
                                </div>
                                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'notifications' && (
                    <div className="p-6">
                        <h2 className="text-xl mb-6">Notification Preferences</h2>
                        <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800/50 rounded-xl p-6 max-w-2xl">
                            <div className="space-y-4">
                                {[
                                    { id: 'new-matches', label: 'New AI-matched candidates', defaultChecked: true },
                                    { id: 'stage-updates', label: 'Candidate stage updates', defaultChecked: true },
                                    { id: 'messages', label: 'New messages from candidates', defaultChecked: true },
                                    { id: 'interviews', label: 'Upcoming interview reminders', defaultChecked: true },
                                    { id: 'weekly-summary', label: 'Weekly pipeline summary', defaultChecked: false },
                                    { id: 'platform-updates', label: 'Platform updates and features', defaultChecked: false },
                                ].map((item) => (
                                    <label key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-900/40 rounded-lg cursor-pointer transition-colors">
                                        <span className="text-gray-300">{item.label}</span>
                                        <input
                                            type="checkbox"
                                            defaultChecked={item.defaultChecked}
                                            className="w-5 h-5 rounded bg-black/50 border-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'privacy' && (
                    <div className="p-6">
                        <h2 className="text-xl mb-6">Privacy & Security</h2>
                        <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800/50 rounded-xl p-6 max-w-2xl">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Data Retention</h3>
                                    <p className="text-sm text-gray-400 mb-3">
                                        Control how long candidate data is stored in your account
                                    </p>
                                    <select className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors">
                                        <option>30 days</option>
                                        <option>90 days</option>
                                        <option selected>6 months</option>
                                        <option>1 year</option>
                                        <option>Indefinitely</option>
                                    </select>
                                </div>

                                <div className="border-t border-gray-800 pt-6">
                                    <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
                                    <p className="text-sm text-gray-400 mb-3">
                                        Add an extra layer of security to your account
                                    </p>
                                    <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors">
                                        Enable 2FA
                                    </button>
                                </div>

                                <div className="border-t border-gray-800 pt-6">
                                    <h3 className="font-semibold mb-2 text-red-400">Danger Zone</h3>
                                    <p className="text-sm text-gray-400 mb-3">
                                        Permanently delete your account and all associated data
                                    </p>
                                    <button className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl transition-colors">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Role Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                            <h2 className="text-xl">{editingRole ? 'Edit Role' : 'Add New Role'}</h2>
                            <button
                                onClick={() => setShowRoleModal(false)}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Job Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Senior Frontend Engineer"
                                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">
                                        Department <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. Engineering"
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g. Remote or San Francisco"
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Employment Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                    >
                                        <option>Full-time</option>
                                        <option>Part-time</option>
                                        <option>Contract</option>
                                        <option>Internship</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Salary Range</label>
                                    <input
                                        type="text"
                                        value={formData.salary}
                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                        placeholder="e.g. $150k - $200k"
                                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Description</label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the role and responsibilities..."
                                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Requirements</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newRequirement}
                                        onChange={(e) => setNewRequirement(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                                        placeholder="Add a requirement..."
                                        className="flex-1 px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    <button
                                        onClick={handleAddRequirement}
                                        className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.requirements.map((req, index) => (
                                        <span
                                            key={index}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 text-gray-300 text-sm rounded-lg border border-gray-700/50"
                                        >
                                            {req}
                                            <button
                                                onClick={() => handleRemoveRequirement(index)}
                                                className="hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' | 'closed' })}
                                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6 flex gap-3">
                            <button
                                onClick={() => setShowRoleModal(false)}
                                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRole}
                                className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
                            >
                                {editingRole ? 'Save Changes' : 'Create Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
