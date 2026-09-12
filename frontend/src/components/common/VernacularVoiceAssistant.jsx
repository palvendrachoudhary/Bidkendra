import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MicrophoneIcon, 
  XMarkIcon, 
  SpeakerWaveIcon, 
  StopIcon, 
  SparklesIcon, 
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { showToast } from '../../utils/toast';

export default function VernacularVoiceAssistant({
  currentBidder = null,
  overallScore = 85,
  hasMandatoryFailure = false,
  verificationCards = {}
}) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { currentLang, t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [language, setLanguage] = useState(() => currentLang === 'hi' ? 'hi' : 'en'); // 'en' or 'hi'
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');

  // Sync internal assistant language with global portal language
  useEffect(() => {
    setLanguage(currentLang === 'hi' ? 'hi' : 'en');
  }, [currentLang]);

  const recognitionRef = useRef(null);

  const bidderName = currentBidder?.name || currentBidder?.company_name || 'PetroTech India Pvt Ltd';

  // Compute missing/failed documents
  const missingDocs = React.useMemo(() => {
    const failed = Object.keys(verificationCards || {})
      .filter(k => {
        const c = verificationCards[k];
        return c && (c.checkStatus === 'FAILED' || c.status === 'FAILED' || (!c.verified && c.checkStatus !== 'VERIFIED'));
      })
      .map(k => {
        const c = verificationCards[k];
        return c.checkName || c.name || k.toUpperCase();
      });
    return failed.length > 0 ? failed : ['GSTIN Statutory Validation', 'Class-I Local Content Declaration'];
  }, [verificationCards]);

  // Listen for global custom events from Header microphone button
  useEffect(() => {
    const handleOpenAssistant = (event) => {
      setIsOpen(true);
      setIsMinimized(false);
      if (event.detail?.autoListen) {
        setTimeout(() => startListening(), 200);
      }
    };

    window.addEventListener('open-voice-assistant', handleOpenAssistant);
    return () => window.removeEventListener('open-voice-assistant', handleOpenAssistant);
  }, [language]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // Text-to-Speech function
  const speakText = (text, targetLang = language) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not available');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (targetLang === 'hi') {
      const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
    } else {
      const englishVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india') || v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Natural Language Resolution Engine for both English & Hindi
  const processQuery = (rawQuery, queryLang = language) => {
    const q = rawQuery.trim().toLowerCase();
    setUserTranscript(rawQuery);

    let reply = '';
    let actionCallback = null;

    // 1. Compliance Score Query
    const isScoreQuery = 
      q.includes('compliance score') || 
      q.includes('what is the score') || 
      q.includes('tell me the score') || 
      q.includes('what is score') || 
      q.includes('score') ||
      q.includes('स्कोर') ||
      q.includes('अनुपालन') ||
      q.includes('अंक');

    // 2. Missing Documents Query
    const isMissingQuery = 
      q.includes('missing') || 
      q.includes('document') || 
      q.includes('failed') || 
      q.includes('which documents') || 
      q.includes('what is missing') ||
      q.includes('गायब') ||
      q.includes('दस्तावेज') ||
      q.includes('कागजात') ||
      q.includes('बाकी');

    // 3. Show Report / Navigate Query
    const isReportQuery = 
      q.includes('report') || 
      q.includes('audit') || 
      q.includes('show me the report') || 
      q.includes('open report') ||
      q.includes('view report') ||
      q.includes('रिपोर्ट') ||
      q.includes('दिखाओ') ||
      q.includes('खोलो');

    // 4. Additional: Call Vendor
    const isCallQuery = 
      q.includes('call') || 
      q.includes('phone') || 
      q.includes('vendor call') ||
      q.includes('कॉल') ||
      q.includes('फोन');

    // 5. Additional: Dark Mode
    const isThemeQuery = 
      q.includes('dark mode') || 
      q.includes('theme') || 
      q.includes('लाइट') || 
      q.includes('डार्क');

    const scoreNum = Math.max(0, Math.min(100, Number(overallScore) || 85));
    const riskTxt = scoreNum >= 80 ? 'Low' : scoreNum >= 50 ? 'Medium' : 'High';
    const riskTxtHi = scoreNum >= 80 ? 'कम (सुरक्षित)' : scoreNum >= 50 ? 'मध्यम' : 'उच्च (जोखिमपूर्ण)';

    if (isScoreQuery) {
      if (queryLang === 'hi') {
        reply = `${bidderName} का समग्र वैधानिक अनुपालन स्कोर ${scoreNum} प्रतिशत है। जोखिम मूल्यांकन ${riskTxtHi} है।`;
      } else {
        reply = `The overall statutory compliance score for ${bidderName} is ${scoreNum} percent with ${riskTxt} risk level.`;
      }
      actionCallback = () => {
        showToast(`📊 Compliance Score: ${scoreNum}% (${riskTxt} Risk)`);
      };
    } else if (isMissingQuery) {
      const docStr = missingDocs.slice(0, 3).join(', ');
      if (queryLang === 'hi') {
        reply = `वर्तमान निविदा में अनुपलब्ध या गैर-अनुपालित दस्तावेज हैं: ${docStr}। सक्रिय क्योरिंग अलर्ट भेजा जा सकता है।`;
      } else {
        reply = `The missing or non-compliant statutory documents are: ${docStr}. An active bid curing alert can be dispatched to the vendor.`;
      }
      actionCallback = () => {
        showToast(`🚨 Missing: ${docStr}`);
      };
    } else if (isReportQuery) {
      if (queryLang === 'hi') {
        reply = `सीपीसीएल आधिकारिक वैधानिक अनुपालन रिपोर्ट और निर्णय पैनल खोला जा रहा है।`;
      } else {
        reply = `Navigating to the official CPCL statutory compliance evaluation report.`;
      }
      actionCallback = () => {
        navigate('/reports');
      };
    } else if (isCallQuery) {
      if (queryLang === 'hi') {
        reply = `ट्विलियो वॉइस कॉल एजेंट तैयार किया जा रहा है। वेंडर से तुरंत संपर्क किया जा सकता है।`;
      } else {
        reply = `Initiating Twilio voice dispatch interface for ${bidderName}.`;
      }
      actionCallback = () => {
        window.dispatchEvent(new CustomEvent('open-twilio-modal'));
      };
    } else if (isThemeQuery) {
      toggleTheme();
      if (queryLang === 'hi') {
        reply = `थीम सफलतापूर्वक बदल दी गई है।`;
      } else {
        reply = `Theme mode toggled successfully.`;
      }
    } else {
      if (queryLang === 'hi') {
        reply = `क्षमा करें, मुझे समझ नहीं आया। आप पूछ सकते हैं: 'अनुपालन स्कोर क्या है?', 'कौन से दस्तावेज गायब हैं?', या 'रिपोर्ट दिखाओ'।`;
      } else {
        reply = `I heard: "${rawQuery}". You can ask: "What is the compliance score?", "Which documents are missing?", or "Show me the report".`;
      }
    }

    setAssistantReply(reply);
    speakText(reply, queryLang);
    if (actionCallback) {
      setTimeout(actionCallback, 600);
    }
  };

  // Speech Recognition using Web Speech API
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in this browser. Please use the quick suggestion chips below.');
      return;
    }

    stopSpeaking();

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setUserTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('⚠️ Microphone permission blocked. Try the click chips below!');
        }
      };

      recognition.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          processQuery(transcript, language);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  };

  // Preset chips for instant click testing without microphone
  const sampleSuggestions = language === 'hi' ? [
    { label: 'अनुपालन स्कोर क्या है?', query: 'अनुपालन स्कोर क्या है?' },
    { label: 'कौन से दस्तावेज गायब हैं?', query: 'कौन से दस्तावेज गायब हैं?' },
    { label: 'रिपोर्ट दिखाओ', query: 'रिपोर्ट दिखाओ' },
    { label: 'वेंडर को कॉल करो', query: 'वेंडर को कॉल करो' }
  ] : [
    { label: 'What is the compliance score?', query: 'What is the compliance score?' },
    { label: 'Which documents are missing?', query: 'Which documents are missing?' },
    { label: 'Show me the report', query: 'Show me the report' },
    { label: 'Call vendor', query: 'Call vendor' }
  ];

  return (
    <>
      {/* Floating Bottom-Right Trigger Button when minimized */}
      {isMinimized && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsMinimized(false);
              setIsOpen(true);
            }}
            className="group flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-navy via-blue-900 to-indigo-900 text-white shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20"
            title="Vernacular Voice Assistant (English / हिन्दी)"
          >
            <div className="w-8 h-8 rounded-full bg-saffron text-slate-900 flex items-center justify-center font-bold text-sm shadow">
              <MicrophoneIcon className="w-5 h-5 text-slate-900" />
            </div>
            <div className="text-left pr-1 hidden sm:block">
              <p className="text-xs font-bold leading-none">Bidकेन्द्र Voice</p>
              <p className="text-[10px] text-blue-200">English | हिन्दी</p>
            </div>
            <SparklesIcon className="w-4 h-4 text-saffron animate-pulse" />
          </button>
        </div>
      )}

      {/* Expanded Voice Assistant Dialog */}
      {!isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-navy via-blue-900 to-indigo-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-saffron text-slate-900 flex items-center justify-center shadow font-bold">
                <MicrophoneIcon className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">{t('Vernacular Voice Assistant')}</h3>
                <p className="text-[10px] text-blue-200">{t('Bidकेन्द्र Procurement Voice Agent')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Bilingual Pill Toggle */}
              <div className="flex items-center bg-white/10 p-0.5 rounded-full text-[11px] font-bold border border-white/20">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    language === 'en' ? 'bg-white text-navy shadow font-bold' : 'text-white/80 hover:text-white'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    language === 'hi' ? 'bg-saffron text-slate-950 shadow font-bold' : 'text-white/80 hover:text-white'
                  }`}
                >
                  🇮🇳 हिन्दी
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  setIsMinimized(true);
                }}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize"
              >
                <ChevronDownIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conversation Transcript Area */}
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto bg-slate-50 dark:bg-slate-850/50">
            {/* Greeting */}
            <div className="flex items-start gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                🤖
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm">
                {language === 'hi' 
                  ? 'नमस्ते! मैं Bidकेन्द्र वॉइस असिस्टेंट हूँ। आप मुझसे निविदा अनुपालन, गायब दस्तावेजों या ऑडिट रिपोर्ट के बारे में पूछ सकते हैं।'
                  : 'Namaste! I am the Bidकेन्द्र Voice Assistant. Speak or tap below to query compliance scores, missing statutory certificates, or reports.'}
              </div>
            </div>

            {/* User Transcript Bubble */}
            {userTranscript && (
              <div className="flex items-start justify-end gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white leading-relaxed shadow-sm max-w-[80%]">
                  <span className="font-semibold block text-[10px] text-blue-200 mb-0.5">🗣️ You said:</span>
                  {userTranscript}
                </div>
              </div>
            )}

            {/* Assistant Response Bubble */}
            {assistantReply && (
              <div className="flex items-start gap-2 text-xs animate-in fade-in duration-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  🤖
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm max-w-[85%]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-400">🤖 Bidकेन्द्र:</span>
                    {isSpeaking ? (
                      <button 
                        onClick={stopSpeaking} 
                        className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5"
                      >
                        <StopIcon className="w-3 h-3" /> {t('Stop')}
                      </button>
                    ) : (
                      <button 
                        onClick={() => speakText(assistantReply, language)} 
                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"
                      >
                        <SpeakerWaveIcon className="w-3 h-3" /> {t('Replay')}
                      </button>
                    )}
                  </div>
                  {assistantReply}
                </div>
              </div>
            )}

            {/* Listening Animation Indicator */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  {language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce"></span>
                  <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips (For instant click testing) */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>{t('Quick Query Chips:')}</span>
              <span className="text-slate-400">{t('Click to query')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sampleSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => processQuery(item.query, language)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all font-medium text-left"
                >
                  💬 {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Microphone Footer Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
              {t('Bidder:')} <span className="font-semibold text-slate-700 dark:text-slate-300">{t(bidderName)}</span>
            </div>

            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1"
                >
                  <StopIcon className="w-3.5 h-3.5" /> {t('Stop Voice')}
                </button>
              )}

              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-full shadow-md flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse scale-110' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking (Microphone)'}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
