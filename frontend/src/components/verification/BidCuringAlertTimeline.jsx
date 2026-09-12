import React, { useState, useEffect, useMemo } from 'react';
import { 
  BellAlertIcon, 
  ClockIcon, 
  PhoneIcon, 
  PaperAirplaneIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ShieldExclamationIcon,
  ArrowPathIcon,
  SparklesIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getAlertTimelineApi, triggerCuringAlertApi } from '../../services/api';
import { showToast } from '../../utils/toast';

export default function BidCuringAlertTimeline({
  vendorName = 'PetroTech India Pvt Ltd',
  vendorEmail = 'vendor@example.com',
  phoneNumber = '+91 98765 43210',
  bidderId = 'b1',
  tenderNumber = 'CPCL-2026-T1001',
  overallScore = 0,
  hasMandatoryFailure = false,
  verificationCards = {},
  onCallVendor = null
}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [curingDeadline, setCuringDeadline] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 47, minutes: 54, seconds: 20 });

  // Calculate failed items
  const failedItems = useMemo(() => {
    return Object.keys(verificationCards || {})
      .filter(k => {
        const c = verificationCards[k];
        return c && (c.checkStatus === 'FAILED' || c.status === 'FAILED' || (!c.verified && c.checkStatus !== 'VERIFIED'));
      })
      .map(k => {
        const c = verificationCards[k];
        return c.checkName || c.name || k.toUpperCase();
      });
  }, [verificationCards]);

  // Initial seed fallback if backend is empty
  const defaultSampleAlerts = useMemo(() => [
    {
      id: 'alt-default-1',
      alert_type: 'DISCREPANCY_FLAGGED',
      channel: 'OCR Engine',
      severity: 'CRITICAL',
      title: 'Statutory Discrepancy Flagged — Active Curing Initiated',
      message: `Automated OCR scan flagged missing/non-compliant items (${failedItems.slice(0, 2).join(', ') || 'Mandatory GSTIN & Local Content'}). 48-hour cure window opened under GFR Rule 173.`,
      status: 'ACTIVE',
      delivery_mode: 'live',
      flagged_items: failedItems.length > 0 ? failedItems : ['Mandatory GSTIN Validation', 'Class-I Local Content Affidavit'],
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      id: 'alt-default-2',
      alert_type: 'WEBHOOK_CURING',
      channel: 'Viasocket Webhook',
      severity: 'WARNING',
      title: 'Automated Remediation Webhook Dispatched',
      message: `Viasocket automated webhook payload sent to ${vendorEmail}. Vendor alerted with secure direct upload link for defect curing.`,
      status: 'DELIVERED',
      delivery_mode: 'live',
      flagged_items: failedItems.length > 0 ? failedItems : ['Mandatory GSTIN Validation'],
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    }
  ], [failedItems, vendorEmail]);

  // Load alert history from API
  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await getAlertTimelineApi(vendorName, 20);
      if (res && res.alerts && res.alerts.length > 0) {
        setAlerts(res.alerts);
      } else {
        setAlerts(defaultSampleAlerts);
      }
    } catch (err) {
      console.warn('Could not fetch alert timeline:', err);
      setAlerts(defaultSampleAlerts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    // 48-hour deadline initialized to 48 hours from 30 mins ago
    const deadline = new Date(Date.now() + 47.5 * 3600 * 1000);
    setCuringDeadline(deadline);
  }, [vendorName]);

  // 48-hour countdown interval timer
  useEffect(() => {
    if (!curingDeadline) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = curingDeadline.getTime() - now;

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining({ hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [curingDeadline]);

  // Dispatch manual Active Bid Curing Webhook
  const handleTriggerCuring = async () => {
    setIsTriggering(true);
    try {
      const payload = {
        vendorName,
        vendorEmail,
        phoneNumber,
        bidderId,
        tender_number: tenderNumber,
        flaggedItems: failedItems.length > 0 ? failedItems : ['Statutory Compliance Envelope Discrepancy'],
        severity: 'CRITICAL',
        title: `Active Bid Curing Notice: ${vendorName}`,
        message: `CPCL compliance verification flagged discrepancies in tender ${tenderNumber}. Vendor must upload corrected certificates within 48 hours.`
      };

      const res = await triggerCuringAlertApi(payload);
      showToast('🚀 Active Bid Curing Webhook Dispatched to Viasocket & Timeline Updated.');

      // Prepend local timeline item immediately
      const newAlert = {
        id: res?.alertId || `alt-manual-${Date.now()}`,
        alert_type: 'WEBHOOK_CURING',
        channel: 'Viasocket Webhook',
        severity: 'CRITICAL',
        title: `Active Bid Curing Dispatched: ${vendorName}`,
        message: `Urgent defect curing notice transmitted to vendor. 48-hour window countdown refreshed under GFR Rule 173.`,
        status: res?.deliveryMode === 'simulated' ? 'SIMULATED' : 'DELIVERED',
        delivery_mode: res?.deliveryMode || 'live',
        flagged_items: payload.flaggedItems,
        created_at: new Date().toISOString()
      };

      setAlerts(prev => [newAlert, ...prev]);
    } catch (err) {
      console.error('Trigger curing error:', err);
      showToast('❌ Failed to trigger curing webhook.');
    } finally {
      setIsTriggering(false);
    }
  };

  // Channel badge styling
  const getChannelBadge = (alert) => {
    const channel = alert.channel || (
      alert.alert_type === 'VOICE_CALL' ? 'Twilio Programmable Voice' :
      alert.alert_type === 'WEBHOOK_CURING' ? 'Viasocket Webhook' :
      'OCR Engine'
    );

    if (channel.includes('Twilio') || alert.alert_type === 'VOICE_CALL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <PhoneIcon className="w-3 h-3" /> Twilio Voice
        </span>
      );
    }
    if (channel.includes('Webhook') || alert.alert_type === 'WEBHOOK_CURING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <PaperAirplaneIcon className="w-3 h-3" /> Viasocket Webhook
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <DocumentMagnifyingGlassIcon className="w-3 h-3" /> OCR Engine
      </span>
    );
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        ', ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return ts;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-6">
      {/* Header with 48h Countdown Timer */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-amber-50/30 to-blue-50/30 dark:from-slate-800 dark:via-amber-950/20 dark:to-blue-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <BellAlertIcon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Bid Curing Notification &amp; Audit Timeline
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                GFR Rule 173
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proactive remediation tracking for <strong>{vendorName}</strong> across multi-channel webhooks &amp; voice calls
            </p>
          </div>
        </div>

        {/* 48-Hour Countdown Window */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800/80 shadow-sm shrink-0">
          <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              48h Active Curing Window
            </div>
            <div className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
              {String(timeRemaining.hours).padStart(2, '0')}h {String(timeRemaining.minutes).padStart(2, '0')}m {String(timeRemaining.seconds).padStart(2, '0')}s
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls Ribbon */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span>Target Vendor: <strong className="text-slate-800 dark:text-slate-200">{vendorName}</strong></span>
          <span>•</span>
          <span className="font-mono">{phoneNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTimeline}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
            title="Refresh Timeline"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {onCallVendor && (
            <button
              type="button"
              onClick={onCallVendor}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>Call Vendor</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTriggerCuring}
            disabled={isTriggering}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <PaperAirplaneIcon className={`w-3.5 h-3.5 ${isTriggering ? 'animate-pulse' : ''}`} />
            <span>{isTriggering ? 'Dispatching...' : 'Dispatch Webhook Alert'}</span>
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="p-5">
        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-6">
          {alerts.map((item, idx) => {
            const isCritical = item.severity === 'CRITICAL';
            const isDelivered = item.status === 'DELIVERED' || item.status === 'COMPLETED';

            return (
              <div key={item.id || idx} className="relative pl-6 group">
                {/* Timeline Pip */}
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                  isCritical ? 'bg-red-500 ring-2 ring-red-200 dark:ring-red-900/50' : 
                  item.alert_type === 'VOICE_CALL' ? 'bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/50' : 
                  'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900/50'
                }`}></div>

                {/* Timeline Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-850 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getChannelBadge(item)}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isDelivered 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {item.status || 'ACTIVE'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatTimestamp(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Flagged Items Pills */}
                  {Array.isArray(item.flagged_items) && item.flagged_items.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Flagged Criteria:</span>
                      {item.flagged_items.map((flag, fIdx) => (
                        <span 
                          key={fIdx}
                          className="px-2 py-0.5 text-[10px] font-medium rounded bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40"
                        >
                          ⚠️ {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
