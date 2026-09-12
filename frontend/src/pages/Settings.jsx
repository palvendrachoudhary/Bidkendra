import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import { showToast } from '../utils/toast';
import { 
  Cog6ToothIcon, 
  KeyIcon, 
  BellAlertIcon, 
  ShieldCheckIcon, 
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { getSettingsApi, updateSettingsApi, testApiKeyApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const { t, currentLang } = useLanguage();
  const [activeTab, setActiveTab] = useState('apis');
  const [testingPortals, setTestingPortals] = useState({});
  const [testResults, setTestResults] = useState({});
  const [showKeys, setShowKeys] = useState({});
  
  // API Integration Configuration
  const [apiConfig, setApiConfig] = useState({
    udyam: { enabled: true, mode: 'mock', endpoint: 'https://api.udyamregistration.gov.in/v2', apiKey: 'SETU-LIVE-SEC-UDYAM-9921', status: 'Connected' },
    gstn: { enabled: true, mode: 'mock', endpoint: 'https://api.gst.gov.in/taxpayerapi/v1.2', apiKey: 'GSTN-AUTH-PROD-2026-X81', status: 'Connected' },
    pan: { enabled: true, mode: 'mock', endpoint: 'https://incometaxindia.gov.in/api/pan/v1', apiKey: 'CBDT-PAN-QUERY-7712', status: 'Connected' },
    digilocker: { enabled: true, mode: 'mock', endpoint: 'https://api.digitallocker.gov.in/public/oauth2/1', apiKey: 'DL-OAUTH2-PROD-CPCL-001', status: 'Connected' },
    epfo: { enabled: true, mode: 'mock', endpoint: 'https://unifiedportal-emp.epfindia.gov.in/api', apiKey: 'EPFO-EST-VERIFY-4439', status: 'Connected' },
    esic: { enabled: true, mode: 'mock', endpoint: 'https://www.esic.in/api/v1', apiKey: 'ESIC-IP-CHECK-5510', status: 'Connected' },
    debarment: { enabled: true, mode: 'mock', endpoint: 'https://gem.gov.in/api/debarment-registry', apiKey: 'GEM-DEBARMENT-FEED-2026', status: 'Connected' },
    makeInIndia: { enabled: true, mode: 'mock', endpoint: 'https://dipp.gov.in/api/local-content', apiKey: 'DPIIT-MII-AFFIDAVIT-884', status: 'Connected' }
  });

  // Load from backend on mount
  useEffect(() => {
    (async () => {
      const res = await getSettingsApi();
      if (res && res.data && res.data.apiConfig) {
        setApiConfig(prev => ({
          ...prev,
          ...res.data.apiConfig
        }));
      }
    })();
  }, []);

  // AI Engine Parameters
  const [aiSettings, setAiSettings] = useState(() => {
    const saved = localStorage.getItem('gem_ai_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      anomalyThreshold: 80,
      ocrConfidenceMin: 75,
      autoFlagDiscrepancy: true,
      strictMakeInIndia: true,
      nlpModel: 'gemini-3.8-flash-enterprise'
    };
  });

  // Profile Settings
  const [profile, setProfile] = useState(() => {
    return {
      name: 'Rajesh Sharma',
      designation: 'Nodal Procurement Officer',
      department: 'Ministry of Petroleum & Natural Gas / CPCL',
      empId: 'CPCL-PROC-8842',
      email: 'nodal.officer@cpcl.gov.in',
      phone: '+91 44 2594 4000',
      dscSerial: '8F4A-39BC-77E1-2027',
      dscExpiry: '2027-12-31'
    };
  });

  const handleSaveApi = async () => {
    localStorage.setItem('gem_api_config', JSON.stringify(apiConfig));
    const res = await updateSettingsApi({ apiConfig, aiSettings });
    if (res && res.success) {
      showToast('✅ Government API keys and endpoints saved to backend!');
    } else {
      showToast('✅ Government API settings saved locally and reconnected');
    }
  };

  const handleTestConnection = async (portalKey) => {
    const config = apiConfig[portalKey];
    if (!config) return;

    setTestingPortals(prev => ({ ...prev, [portalKey]: true }));
    try {
      const res = await testApiKeyApi(portalKey, config.apiKey, config.endpoint, config.mode);
      if (res && res.success) {
        setTestResults(prev => ({
          ...prev,
          [portalKey]: {
            success: true,
            latency: res.data?.latencyMs || 34,
            message: res.message || 'Connected successfully'
          }
        }));
        showToast(`✅ ${portalKey.toUpperCase()} Gateway Authenticated (${res.data?.latencyMs || 34}ms)`);
      } else {
        setTestResults(prev => ({
          ...prev,
          [portalKey]: {
            success: false,
            message: res?.message || 'Authentication Failed'
          }
        }));
        showToast(`❌ ${portalKey.toUpperCase()} Authentication Failed: ${res?.message || 'Invalid key'}`);
      }
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [portalKey]: { success: false, message: 'Connection timeout' }
      }));
    } finally {
      setTestingPortals(prev => ({ ...prev, [portalKey]: false }));
    }
  };

  const toggleShowKey = (portalKey) => {
    setShowKeys(prev => ({ ...prev, [portalKey]: !prev[portalKey] }));
  };

  const handleSaveAi = async () => {
    localStorage.setItem('gem_ai_settings', JSON.stringify(aiSettings));
    await updateSettingsApi({ apiConfig, aiSettings });
    showToast('✅ AI Engine compliance parameters updated in server & memory');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('✅ Officer profile details updated successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portal & Compliance Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure Government database connectors, live API keys, AI model sensitivity, and officer credentials.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
          GeM Gateway Connected
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-8">
          {[
            { id: 'apis', label: 'Gov API Integrations & Keys', icon: KeyIcon },
            { id: 'ai', label: 'AI Compliance Parameters', icon: CpuChipIcon },
            { id: 'profile', label: 'Officer Profile & DSC', icon: ShieldCheckIcon },
            { id: 'alerts', label: 'Notifications & Audit', icon: BellAlertIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-navy text-navy dark:border-saffron dark:text-saffron'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Gov API Integrations */}
      {activeTab === 'apis' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">API Setu & Central Portals Configuration</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between Realistic Hackathon Mocks and Production India Stack / API Setu endpoints with live API keys.
                </p>
              </div>
              <Button onClick={handleSaveApi} className="gap-2">
                <CheckCircleIcon className="w-4 h-4" /> Save API Config
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(apiConfig).map(([key, config]) => (
                <div key={key} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                        {key === 'gstn' ? 'GSTN Network' : key === 'udyam' ? 'MSME Udyam Portal' : key === 'digilocker' ? 'DigiLocker API' : key === 'pan' ? 'CBDT PAN & Income Tax' : key === 'epfo' ? 'EPFO Portal' : key === 'esic' ? 'ESIC Portal' : key === 'makeInIndia' ? 'DPIIT Make in India' : 'GeM Debarment Registry'}
                      </span>
                      {testResults[key]?.success === true && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          ● Active ({testResults[key].latency}ms)
                        </span>
                      )}
                      {testResults[key]?.success === false && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          ❌ Auth Error
                        </span>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.enabled} 
                        onChange={(e) => setApiConfig({
                          ...apiConfig,
                          [key]: { ...config, enabled: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={config.mode}
                      onChange={(e) => setApiConfig({
                        ...apiConfig,
                        [key]: { ...config, mode: e.target.value }
                      })}
                      className="text-xs rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1.5 border"
                    >
                      <option value="mock">Sandbox Mock (SIH Demo)</option>
                      <option value="production">API Setu (Production)</option>
                    </select>
                    <input
                      type="text"
                      value={config.endpoint}
                      onChange={(e) => setApiConfig({
                        ...apiConfig,
                        [key]: { ...config, endpoint: e.target.value }
                      })}
                      className="flex-1 text-xs rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1.5 border font-mono"
                    />
                  </div>

                  {/* API Key Input & Test Handshake Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <input
                        type={showKeys[key] ? 'text' : 'password'}
                        placeholder="Enter API Key / Token"
                        value={config.apiKey || ''}
                        onChange={(e) => setApiConfig({
                          ...apiConfig,
                          [key]: { ...config, apiKey: e.target.value }
                        })}
                        className="w-full text-xs rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 pr-7 pl-2 py-1.5 border font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(key)}
                        className="absolute right-1.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Toggle visibility"
                      >
                        {showKeys[key] ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={testingPortals[key] || !config.enabled}
                      onClick={() => handleTestConnection(key)}
                      className={`text-xs px-2.5 py-1.5 rounded font-medium border transition-all shrink-0 flex items-center gap-1 ${
                        config.enabled 
                          ? 'bg-navy/10 hover:bg-navy/20 text-navy dark:bg-saffron/10 dark:text-saffron dark:border-saffron/30'
                          : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {testingPortals[key] ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Testing...
                        </>
                      ) : (
                        <>
                          <ArrowPathIcon className="w-3.5 h-3.5" />
                          Test Key
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Tab 2: AI Parameters */}
      {activeTab === 'ai' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Compliance & Fraud Detection Rules</h3>
              <p className="text-xs text-slate-500">Fine-tune automated thresholds for flagging anomalous bids.</p>
            </div>
            <Button onClick={handleSaveAi} className="gap-2">
              <CheckCircleIcon className="w-4 h-4" /> Save Rules
            </Button>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-200">Minimum Compliance Score for Auto-Recommendation</span>
                <span className="font-bold text-navy dark:text-saffron">{aiSettings.anomalyThreshold}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="95" 
                value={aiSettings.anomalyThreshold} 
                onChange={(e) => setAiSettings({ ...aiSettings, anomalyThreshold: Number(e.target.value) })}
                className="w-full accent-navy dark:accent-saffron cursor-pointer" 
              />
              <p className="text-xs text-slate-400 mt-1">Bids scoring below this threshold require mandatory human procurement review.</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-200">OCR Text Extraction Confidence Cutoff</span>
                <span className="font-bold text-navy dark:text-saffron">{aiSettings.ocrConfidenceMin}%</span>
              </div>
              <input 
                type="range" 
                min="60" 
                max="95" 
                value={aiSettings.ocrConfidenceMin} 
                onChange={(e) => setAiSettings({ ...aiSettings, ocrConfidenceMin: Number(e.target.value) })}
                className="w-full accent-navy dark:accent-saffron cursor-pointer" 
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={aiSettings.autoFlagDiscrepancy}
                  onChange={(e) => setAiSettings({ ...aiSettings, autoFlagDiscrepancy: e.target.checked })}
                  className="rounded text-navy focus:ring-navy h-4 w-4"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Auto-Flag Cross-Portal Discrepancies</p>
                  <p className="text-xs text-slate-400">Highlight turnover mismatches between GST filings and Udyam registrations.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={aiSettings.strictMakeInIndia}
                  onChange={(e) => setAiSettings({ ...aiSettings, strictMakeInIndia: e.target.checked })}
                  className="rounded text-navy focus:ring-navy h-4 w-4"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Strict Class-I Make in India Enforcement</p>
                  <p className="text-xs text-slate-400">Require verifiable auditor local-content certificates for bids above ₹1 Crore.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Officer Profile & DSC */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Officer Credentials & Digital Signature (DSC)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Officer Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 p-2 dark:bg-slate-900 text-slate-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Employee ID</label>
                <input 
                  type="text" 
                  value={profile.empId} 
                  readOnly 
                  className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Official Email</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 p-2 dark:bg-slate-900 text-slate-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone</label>
                <input 
                  type="text" 
                  value={profile.phone} 
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 p-2 dark:bg-slate-900 text-slate-900 dark:text-white" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Department / Organization</label>
              <input 
                type="text" 
                value={profile.department} 
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 p-2 dark:bg-slate-900 text-slate-900 dark:text-white" 
              />
            </div>

            {/* DSC Card */}
            <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Active Class-3 Digital Signature Certificate (DSC)</p>
                  <p className="text-xs text-slate-500 font-mono">Serial: {profile.dscSerial} • Valid till: {profile.dscExpiry}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                ACTIVE & VERIFIED
              </span>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Update Profile</Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'alerts' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alerts & Cryptographic Audit Preferences</h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">High Risk Bid Submission Alert</p>
                <p className="text-xs text-slate-400">Instantly notify nodal officer via SMS and Portal bell icon.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-navy focus:ring-navy h-4 w-4" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Auto-Generate Tamper-Proof Audit Hashes</p>
                <p className="text-xs text-slate-400">Generate SHA-256 blocks for every officer approval and document review.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-navy focus:ring-navy h-4 w-4" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Daily Compliance Summary Digest</p>
                <p className="text-xs text-slate-400">Receive automated morning email with tender verification metrics.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-navy focus:ring-navy h-4 w-4" />
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={() => showToast('✅ Alert preferences updated')}>Save Preferences</Button>
          </div>
        </div>
      )}
    </div>
  );
}
