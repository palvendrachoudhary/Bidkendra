import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon, 
  XMarkIcon, 
  SpeakerWaveIcon, 
  StopIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ShieldCheckIcon,
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { callVendorApi, getTwilioStatusApi } from '../../services/api';
import { showToast } from '../../utils/toast';

export default function TwilioCallModal({
  isOpen,
  onClose,
  selectedBidder = null,
  overallScore = 0,
  hasMandatoryFailure = false,
  verificationCards = {},
  tenderNumber = 'CPCL-2026-T1001',
  onCallCompleted = null
}) {
  const [phoneNumber, setPhoneNumber] = useState('+918643067706');
  const [customMessage, setCustomMessage] = useState('');
  const [callState, setCallState] = useState('IDLE'); // IDLE, DIALING, RINGING, IN_PROGRESS, COMPLETED, FAILED
  const [callResult, setCallResult] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState(null);

  const durationTimerRef = useRef(null);
  const callMachineTimerRef = useRef(null);

  const vendorName = selectedBidder?.name || selectedBidder?.company_name || 'PetroTech India Pvt Ltd';
  const vendorEmail = selectedBidder?.email || 'vendor@example.com';
  const bidderId = selectedBidder?.id || 'b1';

  // Compute failed checks list
  const failedChecks = Object.keys(verificationCards || {})
    .filter(k => {
      const c = verificationCards[k];
      return c && (c.checkStatus === 'FAILED' || c.status === 'FAILED' || (!c.verified && c.checkStatus !== 'VERIFIED'));
    })
    .map(k => {
      const c = verificationCards[k];
      return c.checkName || c.name || k.toUpperCase();
    });

  const isCompliant = overallScore >= 80 && !hasMandatoryFailure;

  // Generate dynamic TTS speech script
  const generatedScript = React.useMemo(() => {
    if (!isCompliant) {
      const failedStr = failedChecks.length > 0 
        ? failedChecks.slice(0, 3).join(', ') 
        : 'Statutory GSTIN and Make in India local content declarations';

      return `Namaste. This is an automated compliance priority notice from Chennai Petroleum Corporation Limited (CPCL) for Tender ${tenderNumber}. Your bid submission for ${vendorName} requires immediate attention. The following statutory criteria failed validation: ${failedStr}. Under CPCL Active Bid Curing rules, please log in to the GeM portal and submit corrected certificates within 48 hours to avoid disqualification. Thank you.`;
    } else {
      return `Namaste. This is Chennai Petroleum Corporation Limited. Your bid submission for Tender ${tenderNumber} has successfully cleared all 14 statutory compliance gates with an overall score of ${overallScore} percent. Your technical envelope is qualified for commercial evaluation. Thank you.`;
    }
  }, [isCompliant, failedChecks, tenderNumber, vendorName, overallScore]);

  // Fetch Twilio gateway status and verified numbers
  useEffect(() => {
    if (isOpen) {
      getTwilioStatusApi().then(cfg => {
        setTwilioConfig(cfg);
        if (cfg?.verifiedNumbers && cfg.verifiedNumbers.length > 0) {
          if (!selectedBidder?.phone && !selectedBidder?.phone_number) {
            setPhoneNumber(cfg.verifiedNumbers[0]);
          }
        }
      });
    }
  }, [isOpen]);

  // Set initial phone and script on mount or when bidder changes
  useEffect(() => {
    if (selectedBidder?.phone || selectedBidder?.phone_number) {
      setPhoneNumber(selectedBidder.phone || selectedBidder.phone_number);
    } else if (twilioConfig?.verifiedNumbers && twilioConfig.verifiedNumbers.length > 0) {
      setPhoneNumber(twilioConfig.verifiedNumbers[0]);
    } else {
      setPhoneNumber('+918643067706');
    }
    setCustomMessage(generatedScript);
    setCallState('IDLE');
    setCallResult(null);
    setCallDuration(0);
  }, [selectedBidder, generatedScript, twilioConfig]);

  // Cleanup speech and timers on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (callMachineTimerRef.current) clearTimeout(callMachineTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // TTS Voice Preview using browser SpeechSynthesis
  const handleListenPreview = () => {
    if (!window.speechSynthesis) {
      showToast('Speech synthesis not supported in this browser.');
      return;
    }

    if (isPlayingPreview) {
      window.speechSynthesis.cancel();
      setIsPlayingPreview(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = customMessage.trim() || generatedScript;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Prefer Indian English or natural voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes('IN') || v.name.includes('India') || v.name.includes('Indian'));
    if (indianVoice) utterance.voice = indianVoice;
    
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingPreview(true);
    utterance.onend = () => setIsPlayingPreview(false);
    utterance.onerror = () => setIsPlayingPreview(false);

    window.speechSynthesis.speak(utterance);
  };

  // Initiate Twilio Voice Call
  const handleInitiateCall = async () => {
    if (isPlayingPreview && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingPreview(false);
    }

    const cleanPhone = (phoneNumber || '').trim().replace(/[\s\-()]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      showToast('⚠️ Please enter a valid phone number (e.g. +918643067706)');
      return;
    }

    // Step 1: DIALING
    setCallState('DIALING');
    setCallDuration(0);

    try {
      // Step 2: Trigger backend Twilio Voice API
      const res = await callVendorApi({
        phoneNumber: cleanPhone,
        vendorName,
        vendorEmail,
        bidderId,
        missingDocuments: failedChecks.length > 0 ? failedChecks : ['Statutory Compliance Verification'],
        customMessage: customMessage.trim() || generatedScript,
        tenderNumber
      });

      setCallResult(res);

      if (res?.mode === 'live') {
        showToast(`📞 Placing live call to ${cleanPhone}...`);
      } else if (res?.details?.twilioError) {
        showToast(`ℹ️ Notice: ${res.details.twilioError}`);
      }

      setCallState('RINGING');

      setTimeout(() => {
        setCallState('IN_PROGRESS');

        // Start active call duration timer
        let seconds = 0;
        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
        durationTimerRef.current = setInterval(() => {
          seconds += 1;
          setCallDuration(seconds);

          if (seconds >= (res?.mode === 'live' ? 30 : 8)) {
            clearInterval(durationTimerRef.current);
            setCallState('COMPLETED');
            showToast('📞 Call completed.');
            if (onCallCompleted) {
              onCallCompleted({
                vendorName,
                phoneNumber: cleanPhone,
                callSid: res?.callSid || `CA-SIM-${Date.now()}`,
                mode: res?.mode || 'simulated',
                duration: seconds,
                spokenText: customMessage.trim() || generatedScript,
                timestamp: new Date().toISOString()
              });
            }
          }
        }, 1000);

      }, 1500);

    } catch (err) {
      console.error('Call initiation error:', err);
      setCallState('FAILED');
      showToast('❌ Failed to place voice call.');
    }
  };

  // Manual end call button while in progress
  const handleEndCallNow = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallState('COMPLETED');
    showToast('📞 Call ended by operator.');
    if (onCallCompleted) {
      onCallCompleted({
        vendorName,
        phoneNumber,
        callSid: callResult?.callSid || `CA-SIM-${Date.now()}`,
        mode: callResult?.mode || 'simulated',
        duration: callDuration || 5,
        spokenText: customMessage.trim() || generatedScript,
        timestamp: new Date().toISOString()
      });
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-md">
              <PhoneIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Twilio Programmable Voice AI Dispatch
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  MoPNG Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated phone notification for bidder: <strong>{vendorName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Twilio Connection Status & Verified Numbers Picker */}
          {twilioConfig?.configured ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Live Twilio Voice Gateway Connected
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Caller ID: {twilioConfig.fromNumber}
                </span>
              </div>

              {twilioConfig.isTrial && (
                <div className="text-xs text-emerald-900 dark:text-emerald-300">
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    <span className="font-bold text-blue-700 dark:text-blue-300">💡 Twilio Trial Notice:</span> Real calls can be received by your Twilio verified phone numbers. Click below to select which number will receive the call:
                  </p>
                  {twilioConfig.verifiedNumbers && twilioConfig.verifiedNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {twilioConfig.verifiedNumbers.map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPhoneNumber(num)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                            phoneNumber.replace(/[\s\-()]/g, '') === num.replace(/[\s\-()]/g, '')
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                              : 'bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>📞</span>
                          <span>{num}</span>
                          {phoneNumber.replace(/[\s\-()]/g, '') === num.replace(/[\s\-()]/g, '') && (
                            <span className="text-[10px] bg-emerald-700 px-1 rounded">Selected</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-start gap-2.5">
              <span className="text-amber-600 dark:text-amber-400 text-base mt-0.5">⚡</span>
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">Simulated Demo Mode</span> (Twilio Credentials Not Configured in .env).
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Full voice calling simulation will execute with realistic state transitions, audio preview, and in-app timeline logging.
                </p>
              </div>
            </div>
          )}

          {/* Call Status Visualizer when active or completed */}
          {callState !== 'IDLE' && (
            <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-center space-y-3">
              {callState === 'DIALING' && (
                <div className="py-4 space-y-3">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
                    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <PhoneIcon className="w-7 h-7 animate-bounce" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dialing Outbound Gateway...</h3>
                    <p className="text-xs font-mono text-slate-500">{phoneNumber}</p>
                  </div>
                </div>
              )}

              {callState === 'RINGING' && (
                <div className="py-4 space-y-3">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping"></div>
                    <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                      <PhoneIcon className="w-7 h-7" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">Ringing Vendor Terminal...</h3>
                    <p className="text-xs font-mono text-slate-500">Connecting to {vendorName}</p>
                  </div>
                </div>
              )}

              {callState === 'IN_PROGRESS' && (
                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-center gap-1.5 h-12">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="w-1.5 h-10 bg-emerald-500 rounded-full animate-pulse delay-75"></span>
                    <span className="w-1.5 h-8 bg-emerald-500 rounded-full animate-pulse delay-150"></span>
                    <span className="w-1.5 h-12 bg-emerald-500 rounded-full animate-pulse delay-100"></span>
                    <span className="w-1.5 h-7 bg-emerald-500 rounded-full animate-pulse delay-200"></span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        Call Active — AI TTS Voice Agent Speaking
                      </h3>
                    </div>
                    <p className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100 mt-1">
                      ⏱️ {formatTime(callDuration)}
                    </p>
                    <p className="text-[11px] text-slate-500">Playing dynamic compliance instructions to vendor</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEndCallNow}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                  >
                    End Call Early
                  </button>
                </div>
              )}

              {callState === 'COMPLETED' && (
                <div className="py-3 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircleIcon className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Voice Call Completed &amp; Timeline Updated
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-mono space-y-0.5">
                    <div>Call SID: <span className="font-bold">{callResult?.callSid || `CA-SIM-${Date.now()}`}</span></div>
                    <div>Call Duration: <span className="font-bold">{callDuration || 8}s</span></div>
                    <div>Mode: <span className="uppercase font-bold text-blue-600 dark:text-blue-400">{callResult?.mode || 'simulated'}</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCallState('IDLE');
                      onClose();
                    }}
                    className="mt-2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Normal Config View (Editable phone & script) */}
          {callState === 'IDLE' && (
            <>
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Vendor Official Phone Number (E.164 Format)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pre-filled from bidder registration or tender submission contact.
                </p>
              </div>

              {/* Speech Script Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-blue-500" />
                    Dynamic Text-to-Speech (TTS) Message Script
                  </label>
                  <span className="text-[10px] text-slate-400">Auto-generated based on verification score</span>
                </div>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Audio Preview and Curing Notice */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                <div className="text-xs text-blue-900 dark:text-blue-300 space-y-0.5">
                  <div className="font-bold flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" /> 48-Hour Active Bid Curing Notice
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Vendor will receive official voice notification and audio record on their registered terminal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleListenPreview}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
                    isPlayingPreview
                      ? 'bg-red-600 text-white border-red-600 animate-pulse'
                      : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                  }`}
                >
                  {isPlayingPreview ? (
                    <>
                      <StopIcon className="w-3.5 h-3.5" /> Stop Preview
                    </>
                  ) : (
                    <>
                      <SpeakerWaveIcon className="w-3.5 h-3.5" /> 🔊 Listen Preview
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {callState === 'IDLE' && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleInitiateCall}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md transition-colors"
            >
              <PhoneIcon className="w-4 h-4" />
              <span>Initiate Call via Twilio</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
