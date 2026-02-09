import React, { useState } from 'react';
import type { Theme } from '../types';

interface QuoteFormProps {
  theme?: Theme; // Optional prop to adapt colors
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ theme = 'light' }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    q1: '',
    q2: '',
    q3: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Dynamic styles based on theme
  const textClass = theme === 'light' ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = theme === 'light' ? 'text-stone-500' : 'text-stone-400';
  const borderClass = theme === 'light' ? 'border-stone-200' : 'border-stone-700';
  
  // Accents
  // text-base prevents iOS zoom on focus
  const inputClass = theme === 'light' 
    ? 'text-stone-700 border-stone-300 focus:border-cyan-800 text-base' 
    : 'text-stone-200 border-stone-600 focus:border-cyan-400 text-base';
  
  const progressBarActive = theme === 'light' ? 'bg-cyan-900' : 'bg-cyan-200';

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsDone(true);
  };

  if (isDone) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
        <div className="text-4xl mb-4">✨</div>
        <h3 className={`text-xl font-light mb-2 ${textClass}`}>Vielen Dank.</h3>
        <p className={`${subTextClass} text-sm`}>Ich melde mich in Kürze bei dir.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Progress Bar */}
      <div className="flex gap-1 mb-6 md:mb-8 shrink-0">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? `w-8 ${progressBarActive}` : (theme === 'light' ? 'w-2 bg-stone-200' : 'w-2 bg-stone-800')}`} />
        ))}
      </div>

      <form onSubmit={step === 4 ? handleSubmit : handleNext} className="flex-1 flex flex-col justify-between overflow-hidden">
        
        {/* Scrollable Input Area */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col">
          <div className="animate-in slide-in-from-right-4 fade-in duration-500 flex flex-col h-full" key={step}>
            
            {step === 1 && (
              <>
                <label className={`block text-lg md:text-xl font-light leading-snug mb-4 md:mb-6 ${textClass}`}>
                  Was muss passieren, damit du unsere Zusammenarbeit als vollen Erfolg siehst?
                </label>
                {/* flex-1 allows textarea to fill space on mobile without fixed height issues */}
                <textarea 
                  required
                  className={`w-full bg-transparent border-b outline-none py-2 resize-none flex-1 min-h-[100px] transition-colors ${inputClass}`}
                  placeholder="z.B. Mehr Anfragen, besseres Image..."
                  value={formData.q1}
                  onChange={e => handleChange('q1', e.target.value)}
                  autoFocus
                />
              </>
            )}

            {step === 2 && (
              <>
                <label className={`block text-lg md:text-xl font-light leading-snug mb-4 md:mb-6 ${textClass}`}>
                  Woran würdest du merken, dass sich die Investition gelohnt hat?
                </label>
                <textarea 
                  required
                  className={`w-full bg-transparent border-b outline-none py-2 resize-none flex-1 min-h-[100px] transition-colors ${inputClass}`}
                  placeholder="Messbare Ziele oder Bauchgefühl..."
                  value={formData.q2}
                  onChange={e => handleChange('q2', e.target.value)}
                  autoFocus
                />
              </>
            )}

            {step === 3 && (
              <>
                <label className={`block text-lg md:text-xl font-light leading-snug mb-4 md:mb-6 ${textClass}`}>
                  In welchem Rahmen soll sich das Projekt bewegen?
                </label>
                <div className="flex-1">
                    <select 
                        required
                        className={`w-full bg-transparent border-b outline-none py-4 mb-4 cursor-pointer text-base ${inputClass}`}
                        value={formData.q3}
                        onChange={e => handleChange('q3', e.target.value)}
                        autoFocus
                    >
                        <option value="" disabled className="text-black">Bitte wählen...</option>
                        <option value="starter" className="text-black">Essential (CHF 2'000)</option>
                        <option value="custom" className="text-black">Custom (ab CHF 5'000)</option>
                        <option value="unsure" className="text-black">Noch unsicher</option>
                    </select>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <label className={`block text-lg md:text-xl font-light leading-snug mb-4 md:mb-6 ${textClass}`}>
                  Wohin darf ich die Antwort senden?
                </label>
                <div className="flex-1">
                    <input 
                        type="email"
                        required
                        className={`w-full bg-transparent border-b outline-none py-2 ${inputClass}`}
                        placeholder="deine@email.com"
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        autoFocus
                    />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fixed Button Area */}
        <div className={`shrink-0 flex justify-end mt-4 pt-4 md:mt-8 md:pt-6 border-t ${borderClass}`}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`group flex items-center gap-2 text-xs uppercase tracking-widest hover:opacity-60 transition-opacity py-2 ${textClass}`}
          >
            {isSubmitting ? 'Sende...' : step === 4 ? 'Absenden' : 'Weiter'}
            {!isSubmitting && <span className="text-lg leading-none transform group-hover:translate-x-1 transition-transform">→</span>}
          </button>
        </div>
      </form>
    </div>
  );
};
