import React, { useState, useEffect } from 'react';
import type { Service, Theme, TransitionRect } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  originRect: TransitionRect | null;
  services: Service[];
  theme: Theme;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, originRect, services, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    service: '',
    email: '',
    message: '',
    _honey: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    if (isOpen) {
      setShouldRender(true);
      // Small delay to allow render before expanding
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(true);
          setTimeout(() => setShowContent(true), 400);
        });
      });
    } else {
      handleClose();
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowContent(false);
    setIsExpanded(false);
    setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      setFormStatus('idle'); // Reset form on close
      setFormError(null);
      onClose();
    }, 700);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    setFormError(null);

    try {
      const payload = {
        service_id: formData.service || 'general',
        email: formData.email,
        name: formData.email.split('@')[0] || 'Unknown',
        notes: formData.message,
        _honey: formData._honey
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.ok) {
        setFormStatus('success');
      } else {
        setFormError(data.error || 'Unbekannter Fehler.');
        setFormStatus('error');
      }
    } catch (err) {
      setFormError('Netzwerkfehler. Bitte versuche es erneut.');
      setFormStatus('error');
    }
  };

  if (!shouldRender || !originRect) return null;

  // Styles
  const bgClass = theme === 'light' ? 'bg-brand-teal-light' : 'bg-brand-teal-dark';
  const textClass = theme === 'light' ? 'text-brand-teal-dark' : 'text-brand-teal-lightAccent';
  const subTextClass = theme === 'light' ? 'text-brand-teal-dark/70' : 'text-brand-teal-lightAccent/70';

  // Accents
  const inputClass = theme === 'light'
    ? 'text-brand-teal-dark border-brand-teal-dark/30 focus:border-brand-pink placeholder-brand-teal-dark/40 text-base'
    : 'text-brand-teal-lightAccent border-brand-teal-lightAccent/30 focus:border-brand-pink-light placeholder-brand-teal-lightAccent/40 text-base';

  const buttonClass = theme === 'light'
    ? 'bg-brand-teal-dark text-white hover:bg-brand-teal-dark/90 shadow-xl'
    : 'bg-brand-teal-lightAccent text-brand-teal-dark hover:bg-white shadow-xl';

  // Responsive Styles
  const expandedStyle = isMobile ? {
    top: 0,
    left: 0,
    width: '100%',
    height: '100dvh',
    transform: 'none',
    borderRadius: '0px'
  } : {
    top: '50%',
    left: '50%',
    width: 'min(90%, 600px)',
    height: 'min(80vh, 700px)',
    transform: 'translate(-50%, -50%)',
    borderRadius: '24px'
  };

  const initialStyle = {
    top: `${originRect.top}px`,
    left: `${originRect.left}px`,
    width: `${originRect.width}px`,
    height: `${originRect.height}px`,
    transform: 'translate(0, 0)',
    borderRadius: '0px'
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-700 ease-in-out pointer-events-auto ${isExpanded && !isClosing ? 'opacity-100' : 'opacity-0'
          } ${theme === 'light' ? 'bg-brand-teal-light/80' : 'bg-black/80'}`}
        onClick={handleClose}
      />

      {/* Card Container */}
      <div
        className={`fixed shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1) ${bgClass}`}
        style={isExpanded ? expandedStyle : initialStyle}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 md:top-6 md:right-6 z-30 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-500 ${theme === 'light' ? 'bg-white/50 hover:bg-white text-brand-teal-dark' : 'bg-black/50 hover:bg-brand-teal-dark text-white'
            } ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-12 transition-opacity duration-500 delay-100 ${showContent ? 'opacity-100' : 'opacity-0'}`}>

          {formStatus === 'success' ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
              <div className="text-5xl mb-6">✓</div>
              <h2 className={`text-3xl font-light mb-4 ${textClass}`}>Nachricht gesendet.</h2>
              <p className={`max-w-xs mx-auto leading-relaxed ${subTextClass}`}>
                Ich melde mich in der Regel innerhalb von 24 Stunden.
              </p>
              <button
                onClick={handleClose}
                className={`mt-12 px-8 py-3 rounded-full text-xs uppercase tracking-widest border transition-all hover:scale-105 ${theme === 'light' ? 'border-brand-teal-dark text-brand-teal-dark' : 'border-brand-teal-lightAccent text-brand-teal-lightAccent'
                  }`}
              >
                Schliessen
              </button>
            </div>
          ) : formStatus === 'error' ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700 px-4">
              <div className="text-5xl mb-6 opacity-60">!</div>
              <h2 className={`text-2xl font-light mb-4 ${textClass}`}>Versand fehlgeschlagen.</h2>
              <p className={`max-w-xs mx-auto leading-relaxed text-sm ${subTextClass}`}>
                {formError || 'Bitte versuche es erneut oder schreib direkt an:'}
              </p>
              <a
                href="mailto:pascal@oss.studio"
                className={`mt-6 text-sm underline underline-offset-4 ${textClass}`}
              >
                pascal@oss.studio
              </a>
              <button
                onClick={() => { setFormStatus('idle'); setFormError(null); }}
                className={`mt-8 px-8 py-3 rounded-full text-xs uppercase tracking-widest border transition-all hover:scale-105 ${theme === 'light' ? 'border-brand-teal-dark text-brand-teal-dark' : 'border-brand-teal-lightAccent text-brand-teal-lightAccent'
                  }`}
              >
                Nochmal versuchen
              </button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto h-full flex flex-col">
              <div className="mb-6 md:mb-10 shrink-0">
                <span className={`text-xs uppercase tracking-widest block mb-2 opacity-50 ${textClass}`}>Kontakt</span>
                <h2 className={`text-2xl md:text-4xl font-light leading-tight ${textClass}`}>Projekt anfragen.</h2>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 md:gap-8 overflow-y-auto">

                {/* Service Dropdown */}
                <div className="group">
                <label className={`block text-xs uppercase tracking-widest mb-3 ${subTextClass}`}>Ich interessiere mich für</label>
                  <div className="relative">
                    <select
                      required
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className={`w-full bg-transparent border-b py-3 pr-8 appearance-none outline-none cursor-pointer rounded-none transition-colors ${inputClass}`}
                    >
                      <option value="" disabled className={`bg-brand-teal-light text-brand-teal-dark/50`}>Service wählen...</option>
                      {(services ?? []).map((s, index) => {
                        const row = (s ?? {}) as unknown as Record<string, unknown>;
                        const label = String(row.name ?? row.title ?? row.slug ?? `Service ${index + 1}`);
                        const key = String(row.id ?? row.slug ?? label ?? `service-${index}`);
                        return (
                          <option key={`${key}-${index}`} value={label} className="text-black">
                            {label}
                          </option>
                        );
                      })}
                      <option value="other" className="text-black">Other / General Inquiry</option>
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className={`block text-xs uppercase tracking-widest mb-3 ${subTextClass}`}>E-Mail-Adresse</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full bg-transparent border-b py-3 outline-none rounded-none transition-colors ${inputClass}`}
                  />
                  <input
                    type="text"
                    name="_honey"
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData._honey}
                    onChange={e => setFormData({ ...formData, _honey: e.target.value })}
                  />
                </div>

                {/* Message Area */}
                <div className="flex-1 min-h-[100px] md:min-h-[120px]">
                  <label className={`block text-xs uppercase tracking-widest mb-3 ${subTextClass}`}>Nachricht</label>
                  <textarea
                    required
                    placeholder="Was bewegt dich? Timeline, Ziele oder einfach Hallo..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`w-full h-full bg-transparent border-b py-3 outline-none resize-none rounded-none transition-colors ${inputClass}`}
                  />
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-4 md:pt-6 mt-auto shrink-0 pb-4 md:pb-0">
                  <span className={`text-[10px] uppercase tracking-wider opacity-50 ${textClass}`}>
                    {formStatus === 'submitting' ? 'Wird gesendet...' : 'Bereit?'}
                  </span>
                  <button
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    className={`px-8 py-4 rounded-full text-xs uppercase tracking-widest font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 ${buttonClass}`}
                  >
                    {formStatus === 'submitting' ? '...' : 'Anfrage senden'}
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
