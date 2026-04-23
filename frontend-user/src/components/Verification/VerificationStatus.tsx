import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Shield, Activity, Fingerprint, RefreshCcw } from 'lucide-react';

interface VerificationResult {
  status: string;
  composite_trust_score: number;
  flags: string[];
  credits_awarded: number;
  audit_required: boolean;
  audit_type?: string;
}

interface Props {
  actionId: string;
  result: VerificationResult | null;
  onAuditStart: (auditType: string) => void;
}

export const VerificationStatus: React.FC<Props> = ({ actionId, result, onAuditStart }) => {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    if (result) {
      // Simulate scanning animation
      setTimeout(() => setAnalyzing(false), 1500);
    }
  }, [result]);

  if (!result && analyzing) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <Activity className="text-emerald-400 w-8 h-8 animate-spin" />
          <h3 className="text-xl font-bold text-white">Running Multi-Layer Verification...</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-slate-400">
            <Fingerprint className="w-5 h-5" />
            <span>Layer 1: Device Integrity Check</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <Activity className="w-5 h-5" />
            <span>Layer 2: Biometric & GPS Analysis</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <Shield className="w-5 h-5" />
            <span>Layer 3: Cross-Signal Fusion</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isApproved = result.status === 'APPROVED' || result.status === 'PARTIAL';
  const isRejected = result.status === 'REJECTED';

  return (
    <div className={`rounded-xl p-6 border ${
      isApproved ? 'bg-emerald-900/20 border-emerald-500/30' : 
      isRejected ? 'bg-red-900/20 border-red-500/30' : 
      'bg-amber-900/20 border-amber-500/30'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            {isApproved && <CheckCircle className="text-emerald-500 w-8 h-8" />}
            {isRejected && <AlertTriangle className="text-red-500 w-8 h-8" />}
            {result.audit_required && <Shield className="text-amber-500 w-8 h-8" />}
            
            <h3 className="text-2xl font-bold text-white">
              {isApproved && 'Action Verified!'}
              {isRejected && 'Verification Failed'}
              {result.audit_required && 'Spot Audit Required'}
            </h3>
          </div>
          
          <p className="text-slate-300 mt-2">
            Trust Score: <span className="font-mono font-bold ml-2">{(result.composite_trust_score * 100).toFixed(1)}%</span>
          </p>

          {result.flags.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Flags Detected:</h4>
              <ul className="space-y-1">
                {result.flags.map((flag, idx) => (
                  <li key={idx} className="text-xs font-mono text-red-400 bg-red-400/10 px-2 py-1 rounded inline-block mr-2 mb-2">
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {isApproved && (
          <div className="text-right">
            <p className="text-sm text-emerald-400 font-medium">Credits Awarded</p>
            <p className="text-4xl font-bold text-emerald-500">+{result.credits_awarded}</p>
          </div>
        )}
      </div>

      {result.audit_required && result.audit_type && (
        <div className="mt-6 border-t border-amber-500/30 pt-6">
          <p className="text-amber-200 mb-4">
            Due to our probabilistic security model, your action requires a quick manual verification before credits are released.
          </p>
          <button
            onClick={() => onAuditStart(result.audit_type!)}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Shield className="w-5 h-5" />
            <span>Complete {result.audit_type.replace('_', ' ')} Audit</span>
          </button>
        </div>
      )}
    </div>
  );
};
