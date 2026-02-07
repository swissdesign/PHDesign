import React, { useState, useEffect } from 'react';
import { Theme, TransitionRect } from '../types';
import { SERVICES } from '../constants';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  originRect: TransitionRect | null;
  theme: Theme;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, originRect, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    service: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

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
      onClose();
    }, 700);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    // Simulate API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFormStatus('success');
  };

  if (!shouldRender || !originRect) return null;

  // Styles
  const bgClass = theme === 'light' ? 'bg-white' : 'bg-[#1C1917]';
  const textClass = theme === 'light' ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = theme === 'light' ? 'text-stone-500' : 'text-stone-400';
  
  // Accents
  const inputClass = theme === 'light' 
    ? 'text-stone-900 border-stone-300 focus:border-cyan-600 placeholder-stone-400 text-base' 
    : 'text-stone-100 border-stone-700 focus:border-cyan-400 placeholder-stone-600 text-base';
  
  const buttonClass = theme === 'light' 
    ? 'bg-stone-900 text-white hover:bg-cyan-900 shadow-[0_10px_20px_-5px_rgba(8,145,178,0.2)]' 
    : 'bg-white text-stone-900 hover:bg-cyan-200 shadow-[0_10px_20px_-5px_rgba(34,211,238,0.15)]';

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
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-700 ease-in-out pointer-events-auto ${
          isExpanded && !isClosing ? 'opacity-100' : 'opacity-0'
        } ${theme === 'light' ? 'bg-[#FAFAF9]/80' : 'bg-black/80'}`}
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
          className={`absolute top-4 right-4 md:top-6 md:right-6 z-30 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-500 ${
            theme === 'light' ? 'bg-stone-100 hover:bg-stone-200 text-stone-900' : 'bg-stone-800 hover:bg-stone-700 text-stone-100'
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
                <div className="text-5xl mb-6">✨</div>
                <h2 className={`text-3xl font-light mb-4 ${textClass}`}>Message Sent.</h2>
                <p className={`max-w-xs mx-auto leading-relaxed ${subTextClass}`}>
                  Thank you for reaching out. I usually respond within 24 hours.
                </p>
                <button 
                  onClick={handleClose}
                  className={`mt-12 px-8 py-3 rounded-full text-xs uppercase tracking-widest border transition-all hover:scale-105 ${
                    theme === 'light' ? 'border-stone-900 text-stone-900' : 'border-stone-100 text-stone-100'
                  }`}
                >
                  Close
                </button>
             </div>
          ) : (
            <div className="max-w-lg mx-auto h-full flex flex-col">
              <div className="mb-6 md:mb-10 shrink-0">
                <span className={`text-xs uppercase tracking-widest block mb-2 opacity-50 ${textClass}`}>Get in touch</span>
                <h2 className={`text-2xl md:text-4xl font-light leading-tight ${textClass}`}>Let's start a project.</h2>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 md:gap-8 overflow-y-auto">
                
                {/* Service Dropdown */}
                <div className="group">
                  <label className={`block text-xs uppercase tracking-widest mb-3 ${subTextClass}`}>I'm interested in</label>
                  <div className="relative">
                    <select 
                      required
                      value={formData.service}
                      onChange={(e) => setFormData({...formData, service: e.target.value})}
                      className={`w-full bg-transparent border-b py-3 pr-8 appearance-none outline-none cursor-pointer rounded-none transition-colors ${inputClass}`}
                    >
                      <option value="" disabled className="bg-stone-100 text-stone-500">Select a Service...</option>
                      {SERVICES.map(s => (
                        <option key={s.id} value={s.name} className="text-black">{s.name}</option>
                      ))}
                      <option value="other" className="text-black">Other / General Inquiry</option>
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className={`block text-xs uppercase tracking-widest mb-3 ${subTextClass}`}>My Email is</label>
                  <input 
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full bg-transparent border-b py-3 outline-none rounded-none transition-colors ${inputClass}`}
                  />
                </div>

                {/* Message Area */}
                <div className="flex-1 min-h-[100px] md:min-h-[120px]">
                  <label className={`block text-xs uppercase tracking-widest mb-3 ${subTextClass}`}>Message</label>
                  <textarea 
                    required
                    placeholder="Tell me a bit about your goals, timeline, or just say hello..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className={`w-full h-full bg-transparent border-b py-3 outline-none resize-none rounded-none transition-colors ${inputClass}`}
                  />
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-4 md:pt-6 mt-auto shrink-0 pb-4 md:pb-0">
                   <span className={`text-[10px] uppercase tracking-wider opacity-50 ${textClass}`}>
                     {formStatus === 'submitting' ? 'Processing...' : 'Ready to launch'}
                   </span>
                   <button 
                     type="submit"
                     disabled={formStatus === 'submitting'}
                     className={`px-8 py-4 rounded-full text-xs uppercase tracking-widest font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 ${buttonClass}`}
                   >
                     Send Request
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