import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  X, 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  User, 
  Sparkles, 
  LifeBuoy,
  FileText
} from 'lucide-react';

interface TicketSupportPageProps {
  currentUser: any;
  addCustomNotification: (msg: string) => void;
  onBack: () => void;
}

interface TicketMessage {
  id: string;
  sender: 'user' | 'agent';
  senderName: string;
  message: string;
  timestamp: string;
}

interface SupportTicket {
  id: string;
  title: string;
  category: 'Billing' | 'Technical' | 'Hosting' | 'Server';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  messages: TicketMessage[];
}

export default function TicketSupportPage({
  currentUser,
  addCustomNotification,
  onBack
}: TicketSupportPageProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'T-0284',
      title: 'Server memory leakage container limit scale-up',
      category: 'Server',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2026-06-05 10:12',
      messages: [
        {
          id: 'm1',
          sender: 'user',
          senderName: currentUser?.username || 'Admin',
          message: 'My docker node container hits the 4GB ceiling in production benchmarking stress loops. Do you support dynamic node memory ballooning constraints?',
          timestamp: '10:12'
        },
        {
          id: 'm2',
          sender: 'agent',
          senderName: 'AyeZz Technical Lead',
          message: 'Hello! Yes, the AyeZzPanel sandbox utilizes containerized cgroups architecture. I can manually provision a transient memory raise to 8GB scale-up to coordinate your benchmark tests.',
          timestamp: '10:25'
        }
      ]
    },
    {
      id: 'T-1053',
      title: 'Nginx reverse entry config error for virtual app',
      category: 'Hosting',
      priority: 'medium',
      status: 'open',
      createdAt: '2026-06-06 02:44',
      messages: [
        {
          id: 'm3',
          sender: 'user',
          senderName: currentUser?.username || 'Admin',
          message: 'I am getting a bad gateway error 502 proxying external parameters from port 3000 to subdomain virtual application mapping rules.',
          timestamp: '02:44'
        }
      ]
    },
    {
      id: 'T-9905',
      title: 'Billing subscription invoice verification delay',
      category: 'Billing',
      priority: 'low',
      status: 'closed',
      createdAt: '2026-06-01 14:00',
      messages: [
        {
          id: 'm4',
          sender: 'user',
          senderName: currentUser?.username || 'Admin',
          message: 'My crypto coin invoice transfer is complete but the reseller license continues showing pending verification limits.',
          timestamp: '14:00'
        },
        {
          id: 'm5',
          sender: 'agent',
          senderName: 'AyeZz Finance Desk',
          message: 'Greetings! Cryptographic transactions verify automatically on 3 block confirmations. I checked your hash and verified the node. Your reseller plan is now fully enabled.',
          timestamp: '14:35'
        }
      ]
    }
  ]);

  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Billing' | 'Technical' | 'Hosting' | 'Server'>('Technical');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [newInitialMessage, setNewInitialMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Chat window auto scroll refs
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTicket && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages, activeTicket]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newInitialMessage.trim()) return;

    const newTicket: SupportTicket = {
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      messages: [
        {
          id: 'init-msg',
          sender: 'user',
          senderName: currentUser?.username || 'Admin',
          message: newInitialMessage.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setTickets([newTicket, ...tickets]);
    setNewTitle('');
    setNewInitialMessage('');
    setShowCreateModal(false);
    addCustomNotification(`📨 Ticket support ${newTicket.id} was dispatched to our support engineering queue!`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const userMsg: TicketMessage = {
      id: `m-reply-${Date.now()}`,
      sender: 'user',
      senderName: currentUser?.username || 'Admin',
      message: replyText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTicket = {
      ...activeTicket,
      messages: [...activeTicket.messages, userMsg],
      status: 'in_progress' as const
    };

    // Update state lists
    setTickets(prev => prev.map(t => t.id === activeTicket.id ? updatedTicket : t));
    setActiveTicket(updatedTicket);
    setReplyText('');

    // Simulate Agent responses
    setIsTyping(true);
    setTimeout(() => {
      const agentMsg: TicketMessage = {
        id: `m-agent-${Date.now()}`,
        sender: 'agent',
        senderName: 'AyeZz Hosting Expert',
        message: `I have received your response on this item. I am elevating the payload coordinates to our chief architect to investigate the docker microservice specifications. We will push live feedback updates here inside 15-20 minutes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalTicket = {
        ...updatedTicket,
        messages: [...updatedTicket.messages, agentMsg]
      };

      setTickets(prev => prev.map(t => t.id === activeTicket.id ? finalTicket : t));
      setActiveTicket(finalTicket);
      setIsTyping(false);
      addCustomNotification(`💬 AyeZz Support replied back inside active Ticket ${activeTicket.id}`);
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glassmorphism rounded-2xl p-5 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
            <span>AyeZzPanel</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-semibold">Technical Support</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-indigo-400" />
            24/7 Support Engineering Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect directly with AyeZz virtual administrators, log infrastructure troubleshooting tickets or file deployment incidents.
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACTIVE SUPPORT TICKETS */}
        <div className="lg:col-span-5 glassmorphism rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/40">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block font-bold">Your Active Tickets</span>
              <span className="text-[10px] text-slate-500 font-mono">Response time benchmark: under 12 minutes</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-all hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTicket(t)}
                className={`p-4 rounded-2xl border cursor-pointer text-xs transition-all relative ${
                  activeTicket?.id === t.id 
                    ? 'bg-indigo-950/25 border-indigo-500/40 shadow-inner' 
                    : 'bg-slate-950/40 border-slate-900 hover:bg-slate-900/10 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-mono text-[10px] text-indigo-400 font-bold">#{t.id}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                      t.priority === 'high' ? 'bg-rose-955/25 text-rose-400' :
                      t.priority === 'medium' ? 'bg-amber-955/25 text-amber-400' :
                      'bg-indigo-955/25 text-indigo-400'
                    }`}>
                      {t.priority}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      t.status === 'open' ? 'bg-emerald-400 animate-pulse' :
                      t.status === 'in_progress' ? 'bg-indigo-400' : 'bg-slate-600'
                    }`} />
                  </div>
                </div>

                <h4 className="text-slate-200 font-semibold mt-2 truncate pr-4">{t.title}</h4>
                
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-3">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t.messages.length} messages</span>
                  </div>
                  <span>Category: {t.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SUPPORT CORRESPONDENCE CHAT VIEW */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="glassmorphism rounded-3xl overflow-hidden shadow-xl flex flex-col h-[525px]">
              {/* Ticket header details */}
              <div className="bg-slate-950/50 p-4 border-b border-slate-900/80 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">#{activeTicket.id}</span>
                    <span className="text-xs text-slate-400 font-mono">&bull; Created {activeTicket.createdAt}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 truncate mt-1 max-w-[320px]" title={activeTicket.title}>{activeTicket.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono tracking-wide ${
                    activeTicket.status === 'open' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                    activeTicket.status === 'in_progress' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/30' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {activeTicket.status.toUpperCase().replace('_', ' ')}
                  </span>
                  <button 
                    onClick={() => setActiveTicket(null)} 
                    className="p-1 hover:bg-slate-900 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat screen */}
              <div className="flex-grow p-5 overflow-y-auto space-y-4 bg-slate-950/10 scrollbar-thin">
                {activeTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${
                      m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mb-1">
                      <span>{m.senderName}</span>
                      <span>&bull;</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-650/10' 
                        : 'bg-slate-900/60 text-slate-200 border border-slate-900 rounded-tl-none'
                    }`}>
                      {m.message}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex flex-col items-start max-w-[85%]">
                    <span className="text-[10px] text-slate-500 font-mono mb-1">AyeZz Hosting Expert is typing...</span>
                    <div className="p-3 bg-slate-900/60 rounded-2xl rounded-tl-none border border-slate-900 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Reply field form */}
              {activeTicket.status !== 'closed' ? (
                <form onSubmit={handleSendReply} className="p-3 bg-slate-950/80 border-t border-slate-900 flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type technical reply message here..."
                    className="flex-grow bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isTyping}
                    className="p-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-slate-950 border-t border-slate-900 text-center text-xs text-slate-500 font-mono">
                  🔒 Support Item is Closed. Open new issue to initiate queries.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/10 border border-slate-900 border-dashed rounded-3xl h-[525px] flex flex-col items-center justify-center text-center p-6">
              <MessageSquare className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-slate-300 font-semibold text-sm">Select Ticket Incident</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">Click any ticket in the active list panel to expand operational thread messages history logs and chat with technicians.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW SUPPORT TICKET DIALOG MODAL */}
      {showCreateModal && (
        <div id="create-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-400" />
                Dispatch Support Case
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400">Incident Query Summary (Title)</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Postgres DB connection loss from virtual server"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400">Query Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 outline-none text-slate-300"
                  >
                    <option value="Technical">Technical Incident</option>
                    <option value="Server">Virtual Server Node</option>
                    <option value="Hosting">Subdomain Host Config</option>
                    <option value="Billing">Billing & Subscription</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400">Security Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 outline-none text-slate-300"
                  >
                    <option value="low">Standard (Low)</option>
                    <option value="medium">Medium Elevate</option>
                    <option value="high">Critical Incident (High)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Initial Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  placeholder="Provide precise specifications: PIDs, URLs, file paths, parameters, logs outputs..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 text-slate-300 resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider text-[11px]"
              >
                Send Support Ticket
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
