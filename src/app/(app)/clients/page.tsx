// Clients & Project History Screen
// Location: src/app/clients/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import { Client, Project, ProjectType, ProjectStatus } from '@/lib/types';
import { PROPOSAL_TEMPLATES } from '@/lib/templates';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  FolderPlus, 
  ChevronRight, 
  Calendar, 
  FileText, 
  X,
  PlusCircle,
  Briefcase
} from 'lucide-react';

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionFromSearch = searchParams?.get('action');

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedProjectForProposal, setSelectedProjectForProposal] = useState<Project | null>(null);

  // Form states
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    type: 'retaining wall' as ProjectType,
    job_site_address: '',
    description: '',
    desired_start_date: '',
    status: 'Planning' as ProjectStatus
  });

  const loadData = async () => {
    try {
      const clientsList = await db.getClients();
      setClients(clientsList);
      if (clientsList.length > 0 && !selectedClient) {
        setSelectedClient(clientsList[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle auto-triggering modals based on redirect actions
  useEffect(() => {
    if (actionFromSearch === 'new-proposal' && clients.length > 0) {
      // Pick first client or let them choose
      setShowClientModal(false);
    }
  }, [actionFromSearch, clients]);

  useEffect(() => {
    if (selectedClient) {
      db.getProjectHistory(selectedClient.id).then(setProjects).catch(console.error);
    } else {
      setProjects([]);
    }
  }, [selectedClient]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name) return;

    try {
      if (editingClient) {
        const updated = await db.updateClient(editingClient.id, clientForm);
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
        setSelectedClient(updated);
      } else {
        const created = await db.createClient(clientForm);
        setClients(prev => [...prev, created]);
        setSelectedClient(created);
      }
      
      // Reset & close
      setClientForm({ name: '', email: '', phone: '', address: '', notes: '' });
      setEditingClient(null);
      setShowClientModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !projectForm.name) return;

    try {
      const created = await db.createProject({
        ...projectForm,
        client_id: selectedClient.id
      });
      setProjects(prev => [created, ...prev]);
      
      // Reset & close
      setProjectForm({
        name: '',
        type: 'retaining wall',
        job_site_address: '',
        description: '',
        desired_start_date: '',
        status: 'Planning'
      });
      setShowProjectModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditClient = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setShowClientModal(true);
  };

  const triggerCreateProposal = (project: Project) => {
    setSelectedProjectForProposal(project);
    setShowTemplateModal(true);
  };

  const selectTemplateAndRedirect = (templateId: string) => {
    if (!selectedProjectForProposal) return;
    router.push(`/proposals/new?project_id=${selectedProjectForProposal.id}&template_id=${templateId}`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <Users className="h-6 w-6 text-amber-500" />
            <span>Client & Project Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search client records, manage job site locations, and generate proposals.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setClientForm({ name: '', email: '', phone: '', address: '', notes: '' });
            setShowClientModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-xl transition-colors accent-shadow"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Clients List */}
        <div className="bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients by name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">No clients found</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between border-l-4 ${
                    selectedClient?.id === client.id
                      ? 'border-amber-500 bg-amber-50/20'
                      : 'border-transparent'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-semibold text-slate-900 block truncate">{client.name}</span>
                    <span className="text-xs text-slate-500 block mt-0.5 truncate">{client.phone || client.email || 'No contact details'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Selected Client Detail & Projects */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClient ? (
            <>
              {/* Client Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200 premium-shadow p-6 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedClient.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">Client Profile ID: {selectedClient.id.substring(0, 8)}</p>
                  </div>
                  <button
                    onClick={() => openEditClient(selectedClient)}
                    className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors border border-slate-200"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-y border-slate-100 py-4 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedClient.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedClient.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedClient.address || 'No address'}</span>
                  </div>
                </div>

                {selectedClient.notes && (
                  <div>
                    <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Internal Profile Notes</h4>
                    <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {selectedClient.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Client Projects List */}
              <div className="bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                      <Briefcase className="h-5 w-5 text-amber-500" />
                      <span>Projects & Proposals</span>
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setProjectForm({
                        name: '',
                        type: 'retaining wall',
                        job_site_address: selectedClient.address || '',
                        description: '',
                        desired_start_date: '',
                        status: 'Planning'
                      });
                      setShowProjectModal(true);
                    }}
                    className="flex items-center space-x-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Project</span>
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No projects listed</p>
                    <p className="text-xs text-slate-400 mt-1">Create a project to start preparing estimates.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {projects.map((project) => (
                      <div key={project.id} className="p-6 hover:bg-slate-55/30 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-slate-900 text-base">{project.name}</span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 capitalize">
                                {project.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                project.status === 'Active' 
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {project.status}
                              </span>
                            </div>
                            <p className="text-slate-600 text-xs mt-1.5 line-clamp-2">{project.description || 'No description provided.'}</p>
                            
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>{project.job_site_address || 'Same as client address'}</span>
                              </div>
                              {project.desired_start_date && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Start target: {project.desired_start_date}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col gap-2 shrink-0">
                            <button
                              onClick={() => triggerCreateProposal(project)}
                              className="flex items-center justify-center space-x-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2.5 rounded-lg transition-colors border border-amber-600 shadow-sm"
                            >
                              <PlusCircle className="h-4 w-4" />
                              <span>Draft Proposal</span>
                            </button>
                            <button
                              onClick={() => router.push(`/projects/${project.id}`)}
                              className="flex items-center justify-center space-x-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-lg transition-colors border border-slate-200"
                            >
                              <span>View History</span>
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 premium-shadow p-12 text-center text-slate-500 min-h-[400px] flex flex-col justify-center items-center">
              <Users className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-800 text-lg">Select a Client</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">Choose a client from the left directory to view profile logs, project lists, and build proposal estimates.</p>
            </div>
          )}
        </div>
      </div>

      {/* CLIENT DIALOG MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-filter backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 premium-shadow relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowClientModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingClient ? 'Edit Client Profile' : 'Add New Client Record'}
            </h3>

            <form onSubmit={handleClientSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name / Company Name *</label>
                <input
                  type="text"
                  required
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder="e.g. Robert Miller"
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    placeholder="e.g. (402) 555-0100"
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    placeholder="e.g. robert.miller@email.com"
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Billing/Home Address</label>
                <input
                  type="text"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  placeholder="e.g. 543 Dodge St, Omaha, NE 68132"
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Internal Profile Notes</label>
                <textarea
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  placeholder="Notes about client preference, history..."
                  rows={3}
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT DIALOG MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-filter backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 premium-shadow relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowProjectModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Add New Project for {selectedClient?.name}
            </h3>

            <form onSubmit={handleProjectSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g. Backyard Deck & Retaining Wall"
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project Type *</label>
                  <select
                    value={projectForm.type}
                    onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value as ProjectType })}
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                  >
                    <option value="retaining wall">Retaining Wall</option>
                    <option value="concrete">Concrete / Patio</option>
                    <option value="drainage">Drainage Correction</option>
                    <option value="kitchen remodel">Kitchen Remodel</option>
                    <option value="bathroom remodel">Bathroom Remodel</option>
                    <option value="commercial">Commercial Repair</option>
                    <option value="other">Other Project</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Start Date</label>
                  <input
                    type="date"
                    value={projectForm.desired_start_date}
                    onChange={(e) => setProjectForm({ ...projectForm, desired_start_date: e.target.value })}
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Job Site Address *</label>
                <input
                  type="text"
                  required
                  value={projectForm.job_site_address}
                  onChange={(e) => setProjectForm({ ...projectForm, job_site_address: e.target.value })}
                  placeholder="Address where work will be performed"
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Description & Needs</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Outline key customer requirements, measurements..."
                  rows={3}
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPLATE PICKER MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-filter backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl p-6 premium-shadow relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowTemplateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Select Proposal Template
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pre-load standard line items, scopes, warranties, and payment terms for this project type.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Blank option */}
              <button
                onClick={() => {
                  if (selectedProjectForProposal) {
                    router.push(`/proposals/new?project_id=${selectedProjectForProposal.id}`);
                  }
                }}
                className="p-4 text-left border border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/10 rounded-xl transition-all flex flex-col justify-between h-40"
              >
                <div>
                  <span className="font-bold text-slate-900 text-sm block">Start from Scratch</span>
                  <span className="text-xs text-slate-500 block mt-1">Start with a completely blank proposal builder and custom line items.</span>
                </div>
                <span className="text-xs text-amber-600 font-semibold flex items-center space-x-1 self-end mt-2">
                  <span>Create Blank</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>

              {/* Templates */}
              {PROPOSAL_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => selectTemplateAndRedirect(tpl.id)}
                  className="p-4 text-left border border-slate-250 hover:border-amber-500 hover:bg-amber-50/10 rounded-xl transition-all flex flex-col justify-between h-40 hover-lift"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm block truncate pr-2">{tpl.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 capitalize shrink-0">
                        {tpl.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-1 line-clamp-3">{tpl.description}</span>
                  </div>
                  <span className="text-xs text-amber-600 font-semibold flex items-center space-x-1 self-end mt-2">
                    <span>Use Template</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
