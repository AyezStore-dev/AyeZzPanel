import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  ArrowLeft, 
  RotateCw, 
  DollarSign, 
  Receipt, 
  Sparkles, 
  Check, 
  X, 
  ExternalLink, 
  FileText, 
  AlertCircle,
  TrendingUp,
  Wallet
} from 'lucide-react';

interface BillingPageProps {
  currentUser: any;
  addCustomNotification: (msg: string) => void;
  onBack: () => void;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  item: string;
  gateway: string;
  status: 'paid' | 'unpaid' | 'failed';
}

interface HostingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  cpu: string;
  ram: string;
  disk: string;
  domains: string;
  badge?: string;
  popular?: boolean;
}

export default function BillingPage({
  currentUser,
  addCustomNotification,
  onBack
}: BillingPageProps) {
  const [balance, setBalance] = useState(128.50);
  const [isYearly, setIsYearly] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('50.00');
  const [isProcessingFunds, setIsProcessingFunds] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<Invoice | null>(null);
  const [activePlanId, setActivePlanId] = useState('plan-basic');
  const [pricingOverlayPlan, setPricingOverlayPlan] = useState<HostingPlan | null>(null);
  const [isActivatingPlan, setIsActivatingPlan] = useState(false);

  const plans: HostingPlan[] = [
    {
      id: 'plan-basic',
      name: 'Starter Node VPS',
      priceMonthly: 8.00,
      priceYearly: 76.00,
      cpu: '1 Shared VCore',
      ram: '2 GB ECC Dedicated',
      disk: '40 GB NVMe Storage',
      domains: '3 Dedicated Subdomains',
      badge: 'Starter Dev'
    },
    {
      id: 'plan-pro',
      name: 'Reseller Cluster Engine',
      priceMonthly: 24.00,
      priceYearly: 228.00,
      cpu: '2 Private VCores AMD',
      ram: '8 GB ECC Dedicated',
      disk: '120 GB NVMe Storage',
      domains: 'Unlimited domains list',
      badge: 'Most Popular',
      popular: true
    },
    {
      id: 'plan-ultra',
      name: 'Enterprise Dedicated VM',
      priceMonthly: 64.00,
      priceYearly: 590.00,
      cpu: '6 Dedicated Zen4 Cores',
      ram: '24 GB Dedicated RAM',
      disk: '480 GB NVMe Storage',
      domains: 'Unlimited Root domains'
    }
  ];

  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'INV-3281', date: '2026-06-01', amount: 24.00, item: 'Reseller Cluster Engine (Monthly)', gateway: 'Credit Card', status: 'paid' },
    { id: 'INV-1829', date: '2026-05-01', amount: 24.00, item: 'Reseller Cluster Engine (Monthly)', gateway: 'Credit Card', status: 'paid' },
    { id: 'INV-0953', date: '2026-04-12', amount: 15.00, item: 'Subdomain SSL Certificate Purchase', gateway: 'Cloud Crypto', status: 'paid' },
    { id: 'INV-0428', date: '2026-03-01', amount: 8.00, item: 'Starter Node VPS Setup Fee', gateway: 'Digital Wallet', status: 'failed' }
  ]);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(fundAmount);
    if (!amountVal || amountVal <= 0) return;

    setIsProcessingFunds(true);
    setTimeout(() => {
      setBalance(prev => prev + amountVal);
      setInvoices([
        {
          id: `INV-${Math.floor(1000 + Math.random() * 90002)}`,
          date: new Date().toISOString().substring(0, 10),
          amount: amountVal,
          item: 'Deposited Account Balance Funds',
          gateway: 'VCC Secure Gateway',
          status: 'paid'
        },
        ...invoices
      ]);
      setIsProcessingFunds(false);
      setShowAddFundsModal(false);
      addCustomNotification(`💳 Secure Payment verified! $${amountVal.toFixed(2)} was successfully added to your credit balance.`);
    }, 1500);
  };

  const handleApplySubscription = (plan: HostingPlan) => {
    const cost = isYearly ? plan.priceYearly : plan.priceMonthly;
    if (balance < cost) {
      alert(`Insufficient funds. Your active credit balance is $${balance.toFixed(2)}, but this subscription requires $${cost.toFixed(2)}. Please deposit credit funds first.`);
      return;
    }
    setPricingOverlayPlan(plan);
  };

  const handleConfirmPlanActivation = () => {
    if (!pricingOverlayPlan) return;
    const cost = isYearly ? pricingOverlayPlan.priceYearly : pricingOverlayPlan.priceMonthly;
    
    setIsActivatingPlan(true);
    setTimeout(() => {
      setBalance(prev => prev - cost);
      setActivePlanId(pricingOverlayPlan.id);
      setInvoices([
        {
          id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().substring(0, 10),
          amount: cost,
          item: `${pricingOverlayPlan.name} Subscription (${isYearly ? 'Yearly' : 'Monthly'})`,
          gateway: 'Credit Balance',
          status: 'paid'
        },
        ...invoices
      ]);
      setIsActivatingPlan(false);
      setPricingOverlayPlan(null);
      addCustomNotification(`🎉 Subscription updated! ${pricingOverlayPlan.name} is now fully enabled.`);
    }, 1200);
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-mono tracking-wider text-slate-400">SYNCING PAYMENT PROFILE & CONTRACTS...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/35 border border-white/5 rounded-2xl p-5 mb-2 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
            <span>AyeZzPanel</span>
            <span className="text-slate-600">/</span>
            <span className="text-indigo-400 font-semibold">Billing Details</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Billing & VPS Subscription Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add virtual balance funds, print payment receipt files, audit invoices history log, or change hosting plans scale specs.
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

      {/* Grid: Balance Overview and active VPS specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Credit details Balance */}
        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Wallet className="w-24 h-24 text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-bold">Your Credit Funds</h3>
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono block pt-1">
              ${balance.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500 font-mono block">Subsidized virtual balance. Renews automatically on due date.</span>
          </div>

          <div className="pt-5 flex gap-2">
            <button
              onClick={() => setShowAddFundsModal(true)}
              className="flex-grow bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-all text-center"
            >
              Deposit Funds
            </button>
          </div>
        </div>

        {/* Current Hosting Plan specifications detail */}
        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-bold">Current Subscription Plan</h3>
            {plans.filter(p => p.id === activePlanId).map((p) => (
              <div key={p.id}>
                <div className="flex items-center gap-2">
                  <span className="text-slate-100 font-bold text-sm block">{p.name}</span>
                  <span className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-300 py-0.5 px-1.5 border border-indigo-900/40 rounded">ACTIVE</span>
                </div>
                
                <div className="space-y-1.5 text-[11px] text-slate-400 font-mono mt-3">
                  <div className="flex justify-between"><span>Core Threads:</span><span className="text-slate-200">{p.cpu}</span></div>
                  <div className="flex justify-between"><span>Dedicated Virtual RAM:</span><span className="text-slate-200">{p.ram}</span></div>
                  <div className="flex justify-between"><span>Storage limit:</span><span className="text-slate-200">{p.disk}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Billing cycle renewal:</span>
            <span className="text-amber-400">July 01, 2026</span>
          </div>
        </div>

        {/* Dynamic VPS Stats Metrics */}
        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-bold">Reseller Usage Overview</h3>
          
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Account Bandwidth transfer</span>
                <span className="text-indigo-400">124.8 GB / 1024 GB (12.1%)</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                <div className="bg-indigo-500 h-full w-[12.1%] rounded-full"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Domain Limits limits</span>
                <span className="text-indigo-400">3 / 20 Registered</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                <div className="bg-indigo-500 h-full w-[15%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Pricing Comparison list */}
      <div className="bg-slate-905 border border-slate-900 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-4 gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Purchase Hosting/Virtual Machines Plans</h3>
            <p className="text-xs text-slate-500 mt-1">Upgrade or scale specifications seamlessly. Unutilized subscription balances are calculated pro-rata.</p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-900 text-xs">
            <button 
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${!isYearly ? 'bg-indigo-600/20 text-white' : 'text-slate-500 hover:text-slate-200'}`}
              onClick={() => setIsYearly(false)}
            >
              Monthly
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${isYearly ? 'bg-indigo-600/20 text-white' : 'text-slate-500 hover:text-slate-200'}`}
              onClick={() => setIsYearly(true)}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const cost = isYearly ? p.priceYearly : p.priceMonthly;
            const cycleSuffix = isYearly ? '/yr' : '/mo';
            
            return (
              <div 
                key={p.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between relative ${
                  p.popular 
                    ? 'bg-indigo-950/15 border-indigo-500/50 shadow-inner' 
                    : 'bg-slate-950/45 border-slate-900 hover:border-slate-800'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-2.5 right-6 text-[8px] font-mono tracking-widest font-extrabold text-indigo-400 bg-indigo-950 border border-indigo-500/40 uppercase py-1 px-2.5 rounded-full shadow-md">
                    {p.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-slate-400 text-xs font-mono block uppercase">{p.name}</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-extrabold text-white font-mono">${cost.toFixed(2)}</span>
                      <span className="text-slate-500 text-xs font-mono">{cycleSuffix}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-400 border-t border-slate-900 pt-4">
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" />{p.cpu}</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" />{p.ram}</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" />{p.disk}</li>
                    <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" />{p.domains}</li>
                  </ul>
                </div>

                <div className="pt-6">
                  {p.id === activePlanId ? (
                    <div className="w-full text-center py-2 bg-indigo-950/40 text-indigo-400 text-xs font-semibold rounded-xl border border-indigo-900/30">
                      Active Subscription Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApplySubscription(p)}
                      className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        p.popular 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                          : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      Subscribe {isYearly ? 'Yearly' : 'Monthly'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice Section history */}
      <div className="bg-slate-900/20 border border-slate-905 rounded-3xl p-6 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 border-b border-rose-500/10 pb-2">Historic Invoice Receipts Log</h3>
        
        <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/30">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="p-3 pl-4">Invoice ID</th>
                <th className="p-3">Verified Date</th>
                <th className="p-3">Payment Item</th>
                <th className="p-3">Gateway</th>
                <th className="p-3">Amount Charged</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-900 hover:bg-slate-900/10 transition-colors">
                  <td className="p-3 pl-4 font-mono font-bold text-indigo-400">#{inv.id}</td>
                  <td className="p-3 font-mono text-slate-350">{inv.date}</td>
                  <td className="p-3 text-slate-200 font-semibold">{inv.item}</td>
                  <td className="p-3 font-mono text-slate-400">{inv.gateway}</td>
                  <td className="p-3 font-mono font-extrabold text-white">${inv.amount.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide ${
                      inv.status === 'paid' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-right pr-4">
                    <button
                      onClick={() => setShowInvoiceModal(inv)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold transition-all text-[11px] flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD FUNDS INJECTOR */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-400 animate-pulse" />
                Deposit Account Balance
              </h3>
              <button onClick={() => setShowAddFundsModal(false)} className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFundsSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400">Select Credit Amount (USD)</label>
                <div className="grid grid-cols-4 gap-2">
                  {['10.00', '25.00', '50.00', '100.00'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFundAmount(val)}
                      className={`py-2 text-[11px] font-semibold rounded-xl border cursor-pointer font-mono ${
                        fundAmount === val 
                          ? 'bg-indigo-600/20 text-white border-indigo-500' 
                          : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 border-slate-900'
                      }`}
                    >
                      ${parseFloat(val).toFixed(0)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Custom Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 pl-8 outline-none focus:border-indigo-500 font-mono text-slate-300"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-start gap-2.5 text-[10px] text-slate-400 leading-normal">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Simulated Secure VCC payment processor gateway logs are signed using our sandbox SSL token. Zero funds are debited.</span>
              </div>

              <button
                type="submit"
                disabled={isProcessingFunds}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                {isProcessingFunds ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying secure blocks...</span>
                  </>
                ) : (
                  <>
                    <span>Deposit Secure Payment</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* PLAN CONFIRMATION OVERLAY */}
      {pricingOverlayPlan && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs"
          >
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider pb-2 border-b border-slate-800">
              Confirm Hosting Upgrade
            </h3>
            
            <p className="text-slate-400 leading-relaxed">
              You are about to activate the <span className="text-indigo-400 font-bold">{pricingOverlayPlan.name}</span>. 
              The subscription cost of <span className="text-white font-mono font-bold">${(isYearly ? pricingOverlayPlan.priceYearly : pricingOverlayPlan.priceMonthly).toFixed(2)}</span> will be deducted immediately from your credit wallet balances.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1">
              <div className="flex justify-between text-slate-400 font-mono"><span>Your Balance:</span><span className="text-white">${balance.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400 font-mono"><span>Plan Price:</span><span className="text-rose-400">-${(isYearly ? pricingOverlayPlan.priceYearly : pricingOverlayPlan.priceMonthly).toFixed(2)}</span></div>
              <div className="border-t border-slate-900 pt-1 flex justify-between font-mono font-bold"><span>Balance Post-renewal:</span><span className="text-emerald-400">${(balance - (isYearly ? pricingOverlayPlan.priceYearly : pricingOverlayPlan.priceMonthly)).toFixed(2)}</span></div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmPlanActivation}
                disabled={isActivatingPlan}
                className="flex-grow py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-md text-center"
              >
                {isActivatingPlan ? 'Upgrading specs...' : 'Confirm Switch'}
              </button>
              <button
                onClick={() => setPricingOverlayPlan(null)}
                className="px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-indigo-400 font-bold font-semibold">AyeZz Invoice System</span>
              <button onClick={() => setShowInvoiceModal(null)} className="p-1 hover:bg-slate-850 text-slate-500 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white text-slate-950 p-6 rounded-2xl font-mono text-xs space-y-4 relative overflow-hidden shadow-inner select-none pointer-events-none">
              <div className="absolute top-0 right-0 p-4 opacity-5 bg-slate-950">
                <Receipt className="w-32 h-32" />
              </div>
              <div className="text-center">
                <h4 className="font-extrabold text-sm uppercase tracking-wide">AYEZZPANEL INC.</h4>
                <p className="text-[9px] text-slate-500 mt-0.5">Secure Virtual Hosting Platform</p>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 font-mono text-[10px]">
                <div>Invoice Code: #{showInvoiceModal.id}</div>
                <div>Billing Date: {showInvoiceModal.date}</div>
                <div>Status: RECEIVED {showInvoiceModal.status.toUpperCase()}</div>
                <div>Payment Method: {showInvoiceModal.gateway}</div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>Item Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 gap-4">
                  <span className="truncate">{showInvoiceModal.item}</span>
                  <span>${showInvoiceModal.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 font-extrabold text-[12px] flex justify-between">
                <span>TOTAL CHARGED:</span>
                <span>${showInvoiceModal.amount.toFixed(2)}</span>
              </div>

              <div className="text-center text-[8px] text-slate-400 pt-4">
                Thank you for selecting AyeZzPanel hosting servers. SSL sandbox transaction certified.
              </div>
            </div>

            <button
              onClick={() => {
                alert("Receipt file downloading initialized in background sandbox.");
                setShowInvoiceModal(null);
              }}
              className="w-full bg-slate-950 p-2 border border-slate-850 hover:bg-slate-900 rounded-xl text-xs font-semibold text-slate-300 cursor-pointer text-center block"
            >
              Download PDF Receipt
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
