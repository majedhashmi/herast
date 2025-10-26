
import React, { useState, useRef, useEffect } from 'react';
import { useData } from './DataContext';
import { GoogleGenAI } from '@google/genai';
import { SparklesIcon, CloseIcon, PaperAirplaneIcon } from './Icons';
import { useToast } from './Toast';

// A very basic markdown to JSX parser for chat responses.
// It handles paragraphs, bold text (**text**), and unordered lists (* item).
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    const lines = formattedText.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
                    {listItems.map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ')) {
            listItems.push(trimmedLine.substring(2));
        } else {
            flushList();
            if (trimmedLine) {
                elements.push(<p key={`p-${index}`} className="mb-1" dangerouslySetInnerHTML={{ __html: line }} />);
            }
        }
    });

    flushList();

    return <>{elements}</>;
};

const AiAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const data = useData();
    const { showToast } = useToast();
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);
    
    useEffect(() => {
        if(isOpen) {
            if(messages.length === 0) {
                 setMessages([{ role: 'model', content: 'سلام! من «هوش‌یار»، دستیار هوشمند شما هستم. چطور می‌توانم در مدیریت شیفت‌ها به شما کمک کنم؟' }]);
            }
            // Focus input when modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            if (!(await window.aistudio.hasSelectedApiKey())) {
                await window.aistudio.openSelectKey();
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const today = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '/');

            // Construct a concise context for the AI
            const contextPrompt = `
                شما یک دستیار هوشمند به نام «هوش‌یار» برای یک اپلیکیشن مدیریت حراست هستید.
                وظیفه شما پاسخ به سوالات مدیر بر اساس داده‌های لحظه‌ای سیستم است.
                پاسخ‌ها باید به زبان فارسی، دوستانه، و خلاصه باشند.
                از markdown برای قالب‌بندی (مانند **bold** و لیست‌های *) استفاده کن.
                تاریخ امروز ${today} است.
                
                داده‌های سیستم:
                - پرسنل: ${JSON.stringify(data.personnel.map(p => ({name: `${p.name} ${p.family}`, role: p.role, status: p.status})))}
                - پست‌ها: ${JSON.stringify(data.posts)}
                - شیفت‌های ثبت‌شده: ${JSON.stringify(data.shifts.map(s => ({...s, personnelName: data.personnel.find(p => p.id === s.personnelId)?.name, postName: data.posts.find(p => p.id === s.postId)?.name})))}
                - درخواست‌های مرخصی: ${JSON.stringify(data.leaveRequests.map(lr => ({...lr, personnelName: data.personnel.find(p => p.id === lr.personnelId)?.name})))}
                
                سوال کاربر: "${input}"
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contextPrompt,
            });

            const modelResponse = { role: 'model' as const, content: response.text };
            setMessages(prev => [...prev, modelResponse]);

        } catch (error: any) {
            console.error("AI Assistant Error:", error);
            const errorMessageContent = error.message.includes("API key not valid") 
                ? 'کلید API نامعتبر است. لطفاً یک کلید دیگر انتخاب کنید.'
                : 'متاسفانه در ارتباط با سرویس هوشمند مشکلی پیش آمد. لطفا دوباره تلاش کنید.';
            showToast(errorMessageContent, 'error');
            const errorMessage = { role: 'model' as const, content: errorMessageContent };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={`fixed bottom-6 left-6 z-50 transition-all duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-indigo-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
                    aria-label="باز کردن دستیار هوشمند"
                >
                    <span className="animate-pulse-slow absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <SparklesIcon className="w-8 h-8 relative" />
                </button>
            </div>

            <div 
                className={`fixed bottom-0 left-0 w-full max-w-md bg-white dark:bg-[#1f2937] rounded-t-xl shadow-2xl z-50 transition-transform duration-300 ease-in-out border-t border-gray-200 dark:border-[#374151] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ height: '70vh', maxHeight: '500px' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-assistant-title"
                hidden={!isOpen}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-500" />
                        <h2 id="ai-assistant-title" className="text-lg font-bold text-gray-800 dark:text-gray-100">هوش‌یار</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="بستن دستیار هوشمند">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div ref={chatBodyRef} className="h-[calc(100%-128px)] overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center mb-auto"><SparklesIcon className="w-5 h-5 text-indigo-500"/></span>}
                            <div className={`max-w-xs md:max-w-sm p-3 rounded-2xl shadow-sm prose prose-sm dark:prose-invert ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-lg' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'}`}>
                                <SimpleMarkdown text={msg.content} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 animate-fade-in-up justify-start">
                             <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center mb-auto"><SparklesIcon className="w-5 h-5 text-indigo-500"/></span>
                             <div className="max-w-xs md:max-w-sm p-3 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-lg flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#1f2937]/80 backdrop-blur-sm border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="سوال خود را بپرسید..."
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                            aria-label="پیام خود را وارد کنید"
                        />
                        <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50 shrink-0" aria-label="ارسال پیام">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                </footer>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
                @keyframes pulse-slow {
                    50% {
                        opacity: .25;
                    }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
            
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden" onClick={() => setIsOpen(false)}></div>}
        </>
    );
};

export default AiAssistant;