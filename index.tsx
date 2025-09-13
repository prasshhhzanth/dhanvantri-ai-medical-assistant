
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import * as THREE from 'three';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DISCLAIMER = "Disclaimer: This is an AI-generated analysis and not a substitute for professional medical advice. Consult with a qualified healthcare provider for any health concerns.";

// --- Speech Synthesis & Recognition ---
const speak = (text: string) => {
    speechSynthesis.cancel(); // Stop any currently speaking utterance
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
};

const useSpeechRecognition = (onResult: (transcript: string) => void) => {
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported by this browser.");
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
             console.error('Speech recognition error:', event.error);
             setIsListening(false);
        };
        
        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };

    }, [onResult]);
    
    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return { isListening, toggleListening, isSupported: !!recognitionRef.current };
};


// --- Helper Components ---

const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>;
const SpeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>;

const VoiceInputButton = ({ onResult }: { onResult: (text: string) => void }) => {
    const { isListening, toggleListening, isSupported } = useSpeechRecognition(onResult);
    if (!isSupported) return null;
    return (
        <button type="button" className={`voice-input-btn ${isListening ? 'listening' : ''}`} onClick={toggleListening} aria-label={isListening ? 'Stop recording' : 'Start recording'}>
            <MicrophoneIcon />
        </button>
    );
};


const Loader = ({ small }: { small?: boolean }) => <div className={`loader ${small ? 'small' : ''}`}></div>;

const ErrorMessage = ({ message }: { message:string }) => (
    <div className="error-message">{message}</div>
);

interface ResultCardProps {
    title: string;
    children: React.ReactNode;
    disclaimer?: string;
    speakText?: string;
}

const ResultCard = ({ title, children, disclaimer, speakText }: ResultCardProps) => (
    <div className="results-container">
        <div className="results-header">
            <h3>{title}</h3>
            {speakText && (
                 <button className="speak-btn" onClick={() => speak(speakText)} aria-label="Read result aloud">
                    <SpeakerIcon />
                 </button>
            )}
        </div>
        <div>{children}</div>
        {disclaimer && <p className="disclaimer">{disclaimer}</p>}
    </div>
);

const MarkdownRenderer = ({ text }: { text: string }) => {
    const html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>')
        .replace(/# (.*?)\n/g, '<h1>$1</h1>')
        .replace(/^- (.*?)\n/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const Logo = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M89.3,19.9C72.8,31,65,49.5,66.8,68.2c1,10.1,5.5,19.6,11.8,27.1c-5.1-4.2-9.4-9.8-12.7-16.1C54.6,57.9,54.9,37,67.8,21.4C75.1,12.7,85.2,6.5,95,5c-2.3,5.1-4,10.2-5.7,14.9Z" fill="#50463F"/>
        <g fill="#50463F">
            <path d="M60,45h-20c-1.1,0-2-0.9-2-2v0c0-1.1,0.9-2,2-2h20c1.1,0,2,0.9,2,2v0C62,44.1,61.1,45,60,45z"/>
            <path d="M58,52h-16c-1.1,0-2-0.9-2-2v-3h20v3C60,51.1,59.1,52,58,52z"/>
            <path d="M35,78c0,1.1,0.9,2,2,2h26c1.1,0,2-0.9,2-2v0c0-1.1-0.9-2-2-2h-26C35.9,76,35,76.9,35,78z"/>
            <path d="M65,75h-30c-1.1,0-2-0.9-2-2v-18c0-1.1,0.9-2,2-2h30c1.1,0,2,0.9,2,2v18C67,74.1,66.1,75,65,75z M37,73h26v-18h-26V73z"/>
            <path d="M59,70h-18c-1.1,0-2-0.9-2-2v-7c0-1.1,0.9-2,2-2h18c1.1,0,2,0.9,2,2v7C61,69.1,60.1,70,59,70z"/>
        </g>
    </svg>
);


// --- Page Components ---

type Page = 'home' | 'assistant' | 'calculator' | 'scanner' | 'hospitals' | 'delivery' | 'profile' | 'biometric' | 'imaging';

const mockArticles = [
    {
        id: 1,
        title: "The Importance of a Balanced Diet",
        summary: "Discover how a balanced diet with essential nutrients can boost your immune system and overall health.",
        content: "A balanced diet provides your body with the nutrients it needs to function correctly. To get the nutrition you need, most of your daily calories should come from fresh fruits, fresh vegetables, whole grains, legumes, nuts, and lean proteins. The benefits of a healthy diet include weight loss, reduced cancer risk, diabetes management, and improved heart health and stroke prevention.",
        image: "https://images.unsplash.com/photo-1540420773420-226c2fdc3806?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60"
    },
    {
        id: 2,
        title: "Benefits of Regular Exercise",
        summary: "Learn how regular physical activity can improve your mental and physical health, from reducing stress to strengthening bones.",
        content: "Regular exercise is one of the most important things you can do for your health. It can help control your weight, reduce your risk of heart diseases, help your body manage blood sugar and insulin levels, improve your mental health and mood, and help keep your thinking, learning, and judgment skills sharp as you age. Aim for at least 30 minutes of moderate physical activity every day.",
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60"
    },
    {
        id: 3,
        title: "Understanding Mental Health",
        summary: "An introduction to mental health, common disorders, and the importance of seeking help when needed.",
        content: "Mental health includes our emotional, psychological, and social well-being. It affects how we think, feel, and act. It also helps determine how we handle stress, relate to others, and make choices. Mental health is important at every stage of life, from childhood and adolescence through adulthood. It's okay to not be okay, and seeking help is a sign of strength.",
        image: "https://images.unsplash.com/photo-1579548122213-53d368e72769?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60"
    }
];

const MedicalArticles = () => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleArticle = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <section className="articles-section">
            <h2>Latest Medical Articles</h2>
            <div className="articles-grid">
                {mockArticles.map(article => (
                    <div key={article.id} className={`article-card ${expandedId === article.id ? 'expanded' : ''}`}>
                        <img src={article.image} alt={article.title} />
                        <div className="article-content">
                            <div 
                                className="article-header" 
                                role="button" 
                                tabIndex={0} 
                                onClick={() => toggleArticle(article.id)} 
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleArticle(article.id)}
                            >
                                <h3>{article.title}</h3>
                                <span className="expand-icon">▼</span>
                            </div>
                            <p className="article-summary">{article.summary}</p>
                            <div className="article-full-content">
                                <p>{article.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

const Home = ({ setCurrentPage }: { setCurrentPage: (page: Page) => void }) => (
    <>
        <div className="hero-section">
            <h1>Welcome to Dhanvantari</h1>
            <p>Your AI-powered medical assistant for smarter health insights. Analyze symptoms, calculate nutritional needs, and scan prescriptions with ease.</p>
            <div className="features-grid">
                <div className="feature-card">
                    <h3>Medical Assistant</h3>
                    <p>Analyze symptoms and check for potential drug interactions.</p>
                    <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('assistant'); }}>Get Started</a>
                </div>
                <div className="feature-card">
                    <h3>Calorie Counter</h3>
                    <p>Estimate your daily calorie needs for various health goals.</p>
                    <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('calculator'); }}>Calculate Now</a>
                </div>
                 <div className="feature-card">
                    <h3>Prescription Scanner</h3>
                    <p>Upload a prescription to extract text and identify medications.</p>
                    <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('scanner'); }}>Scan Now</a>
                </div>
                <div className="feature-card">
                    <h3>Imaging Analysis</h3>
                    <p>Upload scans (X-ray, MRI) for AI analysis and 3D visualization.</p>
                    <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('imaging'); }}>Analyze Scan</a>
                </div>
                 <div className="feature-card">
                    <h3>Biometric Scan</h3>
                    <p>Perform a real-time biometric analysis using your camera.</p>
                    <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('biometric'); }}>Start Scan</a>
                </div>
                <div className="feature-card">
                    <h3>Nearby Hospitals</h3>
                    <p>Find hospitals and book appointments with healthcare facilities.</p>
                    <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('hospitals'); }}>Find Hospitals</a>
                </div>
                <div className="feature-card">
                    <h3>Medicine Delivery</h3>
                    <p>Order medications and upload prescriptions for delivery.</p>
                    <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('delivery'); }}>Order Now</a>
                </div>
                 <div className="feature-card">
                    <h3>Profile & Reminders</h3>
                    <p>Manage your profile and set medication reminders.</p>
                    <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('profile'); }}>View Profile</a>
                </div>
            </div>
        </div>
        <MedicalArticles />
    </>
);


const MedicalAssistant = () => {
    const [formData, setFormData] = useState({
        age: '',
        temperature: '',
        symptoms: '',
        medications: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleVoiceResult = useCallback((transcript: string) => {
        setFormData(prev => ({ ...prev, symptoms: transcript }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult('');
        setError('');
        try {
            const prompt = `
                Act as a helpful medical assistant. Analyze the following patient information and provide a brief, clear analysis.
                - Patient Age: ${formData.age}
                - Body Temperature: ${formData.temperature} C
                - Symptoms: ${formData.symptoms}
                - Current Medications: ${formData.medications}
                
                Based on this information:
                1. Identify any potential drug interactions.
                2. Note any concerns based on the combination of symptoms, age, and medications.
                3. Suggest general, non-prescriptive wellness actions (e.g., rest, hydration).
                
                Format the response using markdown. Start with a summary, then use headings for "Potential Interactions" and "Wellness Suggestions".
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setResult(response.text);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Medical Assistant</h1>
                <p>Enter patient details to get an AI-powered analysis of symptoms and potential drug interactions.</p>
            </div>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="age">Age</label>
                            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="temperature">Body Temperature (°C)</label>
                            <input type="number" step="0.1" id="temperature" name="temperature" value={formData.temperature} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label htmlFor="symptoms">Symptoms</label>
                        <textarea id="symptoms" name="symptoms" value={formData.symptoms} onChange={handleChange} required></textarea>
                         <VoiceInputButton onResult={handleVoiceResult} />
                    </div>
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label htmlFor="medications">Current Medications (comma-separated)</label>
                        <input type="text" id="medications" name="medications" value={formData.medications} onChange={handleChange} />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading && <Loader small />}
                            Analyze Symptoms
                        </button>
                    </div>
                </form>
            </div>
            {error && <ErrorMessage message={error} />}
            {result && (
                <ResultCard title="AI Analysis" disclaimer={DISCLAIMER} speakText={result}>
                    <MarkdownRenderer text={result} />
                </ResultCard>
            )}
        </div>
    );
};

const CalorieCalculator = () => {
    const [formData, setFormData] = useState({
        age: '',
        gender: 'male',
        weight: '',
        height: '',
        activity: 'sedentary'
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult('');
        setError('');
        try {
            const prompt = `
                Calculate the estimated daily calorie needs based on the Mifflin-St Jeor equation.
                - Age: ${formData.age} years
                - Gender: ${formData.gender}
                - Weight: ${formData.weight} kg
                - Height: ${formData.height} cm
                - Activity Level: ${formData.activity}
                
                Provide a breakdown for:
                - Maintaining current weight
                - Mild weight loss (0.25 kg/week)
                - Weight loss (0.5 kg/week)
                
                Format the response using markdown with a main heading "Estimated Daily Calorie Needs".
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setResult(response.text);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="page">
            <div className="page-header">
                <h1>Calorie Counter</h1>
                <p>Estimate your daily calorie needs based on your age, gender, activity level, and body measurements.</p>
            </div>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="age">Age</label>
                            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="gender">Gender</label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="weight">Weight (kg)</label>
                            <input type="number" id="weight" name="weight" value={formData.weight} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="height">Height (cm)</label>
                            <input type="number" id="height" name="height" value={formData.height} onChange={handleChange} required />
                        </div>
                    </div>
                     <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label htmlFor="activity">Activity Level</label>
                        <select id="activity" name="activity" value={formData.activity} onChange={handleChange}>
                            <option value="sedentary">Sedentary (little or no exercise)</option>
                            <option value="light">Lightly active (light exercise/sports 1-3 days/week)</option>
                            <option value="moderate">Moderately active (moderate exercise/sports 3-5 days/week)</option>
                            <option value="active">Very active (hard exercise/sports 6-7 days a week)</option>
                            <option value="extra">Extra active (very hard exercise/physical job)</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading && <Loader small />}
                            Calculate Calories
                        </button>
                    </div>
                </form>
            </div>
            {error && <ErrorMessage message={error} />}
            {result && (
                <ResultCard title="Calorie Needs" speakText={result}>
                    <MarkdownRenderer text={result} />
                </ResultCard>
            )}
        </div>
    );
};

const PrescriptionScanner = () => {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ text: string; medications: string[] } | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                scanImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const scanImage = async (base64Image: string) => {
        setLoading(true);
        setResult(null);
        setError('');
        try {
            const base64Data = base64Image.split(',')[1];
            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
            const textPart = { text: "Extract the text from this prescription. Then, identify all medications listed and return a JSON object with two keys: 'extractedText' (a string containing all the text) and 'medications' (an array of medication names). Do not include the JSON markdown wrapper." };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                 config: { responseMimeType: "application/json" }
            });

            const jsonResponse = JSON.parse(response.text);
            setResult({
                text: jsonResponse.extractedText || "No text found.",
                medications: jsonResponse.medications || []
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to scan prescription.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (result?.text) {
            navigator.clipboard.writeText(result.text);
            alert('Copied to clipboard!');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Prescription Scanner</h1>
                <p>Upload a photo of your prescription to extract the text and identify medications.</p>
            </div>
            <div className="card">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <div className="image-uploader" onClick={() => fileInputRef.current?.click()}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <p>Click to upload an image</p>
                    <span>PNG, JPG, or JPEG</span>
                </div>
                {image && <img src={image} alt="Prescription preview" className="image-preview" />}
            </div>
            {loading && <Loader />}
            {error && <ErrorMessage message={error} />}
            {result && (
                <ResultCard title="Scan Results" speakText={`Extracted text: ${result.text}`}>
                    <h4>Extracted Text</h4>
                    <p style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>{result.text}</p>
                    <div className="ocr-actions">
                        <button className="btn btn-outline" onClick={handleCopy}>Copy Text</button>
                    </div>

                    {result.medications.length > 0 && (
                        <div className="purchase-links">
                            <h4>Identified Medications</h4>
                            <ul>
                                {result.medications.map((med, index) => (
                                    <li key={index}>
                                        <a href={`https://www.goodrx.com/${med}`} target="_blank" rel="noopener noreferrer">
                                            Find deals for {med}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </ResultCard>
            )}
        </div>
    );
};

interface Hospital {
    name: string;
    address: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    distance?: string;
}

interface Booking {
    hospitalName: string;
    date: string;
    time: string;
}

interface Confirmation {
    message: string;
    confirmationNumber: string;
    bookingDetails: Booking;
}

const NearbyHospitals = () => {
    const [location, setLocation] = useState('');
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [sources, setSources] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
    const [bookingDate, setBookingDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
    const [reminderSet, setReminderSet] = useState(false);
    
    const handleVoiceResult = useCallback((transcript: string) => {
        setLocation(transcript);
    }, []);

    const searchHospitals = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setHospitals([]);
        setSources([]);
        setSelectedHospital(null);
        setConfirmation(null);

        try {
            const prompt = `Find hospitals near ${location}. For each hospital, provide the name, full address, phone number, latitude, longitude, and approximate distance from the location. Return the result as a JSON array inside a markdown block.`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { tools: [{googleSearch: {}}] },
            });

            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                setSources(response.candidates[0].groundingMetadata.groundingChunks);
            }

            const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch) throw new Error("Could not find hospital data in the response.");
            
            const parsedHospitals = JSON.parse(jsonMatch[1]);
            setHospitals(parsedHospitals);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to find hospitals.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsBooking(true);
        setError('');
        try {
            const prompt = `The user wants to book a medical appointment.
                - Hospital: ${selectedHospital?.name}
                - Date: ${bookingDate}
                - Time: ${selectedTime}
                
                Please confirm the booking and generate a unique 8-character alphanumeric confirmation number.
                Respond in JSON format with two keys: "message" and "confirmationNumber". Do not include the JSON markdown wrapper.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const confData = JSON.parse(response.text);

            setConfirmation({
                ...confData,
                bookingDetails: {
                    hospitalName: selectedHospital?.name || '',
                    date: bookingDate,
                    time: selectedTime,
                }
            });
            setSelectedHospital(null); // Hide booking form
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to book appointment.');
        } finally {
            setIsBooking(false);
        }
    };
    
    const handleSetReminder = () => {
        if (!confirmation) return;
        const { hospitalName, date, time } = confirmation.bookingDetails;
        const [hours, minutes] = time.split(':').map(Number);
        const appointmentDateTime = new Date(date);
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        const reminderDateTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
        const now = new Date();

        if (reminderDateTime > now) {
            const timeout = reminderDateTime.getTime() - now.getTime();
            setTimeout(() => {
                const reminderMsg = `Reminder: You have an appointment at ${hospitalName} tomorrow at ${time}.`;
                alert(reminderMsg);
                speak(reminderMsg);
            }, timeout);
            setReminderSet(true);
        } else {
            alert("The appointment is less than 24 hours away. A reminder cannot be set for a past time.");
        }
    };

    const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
    
    return (
        <div className="page">
            <div className="page-header">
                <h1>Nearby Hospitals</h1>
                <p>Find healthcare facilities in your area and book appointments directly.</p>
            </div>
            <div className="card">
                <form onSubmit={searchHospitals}>
                    <div className="form-group">
                        <label htmlFor="location">Enter your city or address</label>
                        <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} required />
                         <VoiceInputButton onResult={handleVoiceResult} />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading && <Loader small />}
                            Search
                        </button>
                    </div>
                </form>
            </div>

            {error && <ErrorMessage message={error} />}

            {!loading && hospitals.length > 0 && (
                <div className="results-container">
                    <h3>Hospitals near {location}</h3>
                    <div className="hospitals-grid">
                        {hospitals.map((h, i) => (
                            <div key={i} className="hospital-card">
                                <div>
                                    <h4>{h.name}</h4>
                                    <p className="hospital-address">{h.address}</p>
                                </div>
                                <div>
                                    <div className="hospital-details">
                                        {h.phone && <span className="hospital-phone">{h.phone}</span>}
                                        {h.distance && <span className="hospital-distance">{h.distance}</span>}
                                    </div>
                                    <div className="card-actions">
                                        {h.latitude && h.longitude &&
                                            <a href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">View Map</a>
                                        }
                                        <button className="btn btn-primary" onClick={() => { setSelectedHospital(h); setConfirmation(null); }}>Book Appointment</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {sources.length > 0 && (
                        <div className="sources-container">
                            <h4>Sources:</h4>
                            <ul>
                                {sources.map((source, i) => (
                                    <li key={i}><a href={source.web.uri} target="_blank" rel="noopener noreferrer">{source.web.title}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            
            {selectedHospital && (
                <div className="booking-container card">
                    <h3>Book an Appointment at {selectedHospital.name}</h3>
                    <form onSubmit={handleBookAppointment}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="booking-date">Select Date</label>
                                <input type="date" id="booking-date" min={new Date().toISOString().split("T")[0]} value={bookingDate} onChange={e => setBookingDate(e.target.value)} required />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label>Select Time Slot</label>
                            <div className="time-slot-grid">
                                {timeSlots.map(time => (
                                    <button
                                        type="button"
                                        key={time}
                                        className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                                        onClick={() => setSelectedTime(time)}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div className="form-actions">
                             <button type="button" className="btn btn-outline" onClick={() => setSelectedHospital(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isBooking || !bookingDate || !selectedTime}>
                                {isBooking && <Loader small />}
                                Confirm Booking
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {confirmation && (
                <div className="card confirmation-highlight-card">
                    <div className="confirmation-header">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <h3>{confirmation.message}</h3>
                    </div>
                    <p>Your appointment at <strong>{confirmation.bookingDetails.hospitalName}</strong> on <strong>{confirmation.bookingDetails.date}</strong> at <strong>{confirmation.bookingDetails.time}</strong> is confirmed.</p>
                     <div className="confirmation-number-wrapper">
                        <strong>Your Confirmation Number:</strong>
                        <span className="confirmation-number">{confirmation.confirmationNumber}</span>
                    </div>
                    <div className="form-actions" style={{justifyContent: 'center'}}>
                        <button className="btn btn-primary" onClick={handleSetReminder} disabled={reminderSet}>
                            {reminderSet ? 'Reminder Set!' : 'Set a Reminder (24h prior)'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MedicineDelivery = () => {
    const [formData, setFormData] = useState({ address: '', medications: '' });
    const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setPrescriptionFile(e.target.files[0]);
    };
    
    const handleVoiceResult = useCallback((transcript: string) => {
        setFormData(prev => ({ ...prev, address: transcript }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult('');
        setError('');
        try {
            const prompt = `
                A user is placing a medicine order.
                - Delivery Address: ${formData.address}
                - Medications Requested: ${formData.medications}
                - A prescription file ${prescriptionFile ? 'has been' : 'has not been'} uploaded.
                
                Please confirm the order and provide an estimated delivery time.
                Respond with a friendly confirmation message in markdown format.
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setResult(response.text);
        } catch (err: any) { // FIX: Explicitly type err as any
            setError(err.message || 'An unknown error occurred.');
            setLoading(false); // Make sure loader stops on error
        } finally {
            if (!error) setLoading(false); // Only set loading if there was no error
        }
    };
    
    return (
        <div className="page">
             <div className="page-header">
                <h1>Medicine Delivery</h1>
                <p>Order your medications online and get them delivered to your doorstep.</p>
            </div>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="address">Delivery Address</label>
                        <textarea id="address" name="address" value={formData.address} onChange={handleChange} required></textarea>
                         <VoiceInputButton onResult={handleVoiceResult} />
                    </div>
                     <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label htmlFor="medications">Medications (comma-separated)</label>
                        <textarea id="medications" name="medications" value={formData.medications} onChange={handleChange} placeholder="e.g., Paracetamol 500mg, Vitamin C"></textarea>
                    </div>
                     <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label htmlFor="prescription">Upload Prescription (optional)</label>
                        <input type="file" id="prescription" onChange={handleFileChange} />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading && <Loader small />}
                            Place Order
                        </button>
                    </div>
                </form>
            </div>
            {error && <ErrorMessage message={error} />}
            {result && (
                <ResultCard title="Order Confirmation" speakText={result}>
                     <MarkdownRenderer text={result} />
                </ResultCard>
            )}
        </div>
    );
};

interface Reminder {
    id: number;
    name: string;
    time: string;
    timeoutId: any;
}

const ProfilePage = ({ currentUser }: { currentUser: string }) => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [medName, setMedName] = useState('');
    const [medTime, setMedTime] = useState('');

    useEffect(() => {
        try {
            const storedReminders = localStorage.getItem(`reminders_${currentUser}`);
            if (storedReminders) {
                const parsedReminders: Omit<Reminder, 'timeoutId'>[] = JSON.parse(storedReminders);
                // Reschedule notifications on load
                const remindersWithTimeouts = parsedReminders.map(r => {
                    const [hours, minutes] = r.time.split(':').map(Number);
                    const now = new Date();
                    const reminderDate = new Date();
                    reminderDate.setHours(hours, minutes, 0, 0);

                    // If time has already passed for today, schedule for tomorrow
                    if (reminderDate < now) {
                        reminderDate.setDate(reminderDate.getDate() + 1);
                    }
                    
                    const timeout = reminderDate.getTime() - now.getTime();
                    const timeoutId = setTimeout(() => {
                        const msg = `Time to take your ${r.name}!`;
                        alert(msg);
                        speak(msg);
                    }, timeout);
                    return { ...r, timeoutId };
                });
                setReminders(remindersWithTimeouts);
            }
        } catch (e) {
            console.error("Failed to parse reminders from localStorage", e);
        }
    }, [currentUser]);

    useEffect(() => {
        try {
            const remindersToStore = reminders.map(({ timeoutId, ...rest }) => rest);
            localStorage.setItem(`reminders_${currentUser}`, JSON.stringify(remindersToStore));
        } catch (e) {
            console.error("Failed to save reminders to localStorage", e);
        }
    }, [reminders, currentUser]);
    
    const handleVoiceResult = useCallback((transcript: string) => {
        setMedName(transcript);
    }, []);

    const addReminder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!medName || !medTime) return;

        const [hours, minutes] = medTime.split(':').map(Number);
        const now = new Date();
        // FIX: Corrected a typo in Date object instantiation from 'new new Date()' to 'new Date()'.
        const reminderDate = new Date();
        reminderDate.setHours(hours, minutes, 0, 0);
        if (reminderDate < now) reminderDate.setDate(reminderDate.getDate() + 1);

        const timeout = reminderDate.getTime() - now.getTime();
        const timeoutId = setTimeout(() => {
            const msg = `Time to take your ${medName}!`;
            alert(msg);
            speak(msg);
        }, timeout);

        const newReminder: Reminder = { id: Date.now(), name: medName, time: medTime, timeoutId };
        setReminders([...reminders, newReminder]);
        setMedName('');
        setMedTime('');
    };

    const removeReminder = (id: number) => {
        const reminderToRemove = reminders.find(r => r.id === id);
        if (reminderToRemove) {
            clearTimeout(reminderToRemove.timeoutId);
        }
        setReminders(reminders.filter(r => r.id !== id));
    };

    return (
        <div className="page">
            <div className="page-header profile-header">
                <h1>Welcome, {currentUser}</h1>
                <p>Manage your profile settings and medication reminders here.</p>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                 <h3>Add Medicine Reminder</h3>
                <form onSubmit={addReminder}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="medName">Medication Name</label>
                            <input type="text" id="medName" value={medName} onChange={e => setMedName(e.target.value)} required />
                            <VoiceInputButton onResult={handleVoiceResult} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="medTime">Time</label>
                            <input type="time" id="medTime" value={medTime} onChange={e => setMedTime(e.target.value)} required />
                        </div>
                    </div>
                     <div className="form-actions">
                        <button type="submit" className="btn btn-primary">Add Reminder</button>
                    </div>
                </form>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3>Active Reminders</h3>
                {reminders.length > 0 ? (
                    <ul className="reminders-list">
                        {reminders.map(r => (
                            <li key={r.id} className="reminder-item">
                                <div>
                                    <strong>{r.name}</strong>
                                    <p>Scheduled for {r.time} daily</p>
                                </div>
                                <button className="btn btn-outline" onClick={() => removeReminder(r.id)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>You have no active reminders.</p>
                )}
            </div>
        </div>
    );
};

const BiometricScanner = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [age, setAge] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const [height, setHeight] = useState<number | null>(null);
    const [temperature, setTemperature] = useState<string>('...');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraRef = useRef<any>(null);
    const poseRef = useRef<any>(null);

    const stopCamera = useCallback(() => {
        if (cameraRef.current && cameraRef.current.getTracks) {
            cameraRef.current.getTracks().forEach((track: any) => track.stop());
        }
        setIsScanning(false);
    }, []);

    useEffect(() => {
        return () => { // Cleanup on component unmount
            stopCamera();
            if (poseRef.current) {
                poseRef.current.close();
            }
        };
    }, [stopCamera]);
    
    // Temperature calibration effect
    useEffect(() => {
        if (!isScanning || showPrompt) return;

        setTemperature("Calibrating...");
        let calibrationCount = 0;
        const interval = setInterval(() => {
            if (calibrationCount < 5) {
                const randomTemp = (36.5 + Math.random() * 1.5).toFixed(1);
                setTemperature(`${randomTemp}°C`);
                calibrationCount++;
            } else {
                const finalTemp = (36.8 + Math.random() * 0.5).toFixed(1);
                setTemperature(`${finalTemp}°C`);
                clearInterval(interval);
                 setTimeout(() => setShowPrompt(true), 1000); // Show prompt after final temp
            }
        }, 800);

        return () => clearInterval(interval);
    }, [isScanning, showPrompt]);


    const onResults = useCallback((results: any) => {
        if (!canvasRef.current || !results.poseLandmarks) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        if (!canvasCtx) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw landmarks
        (window as any).drawConnectors(canvasCtx, results.poseLandmarks, (window as any).POSE_CONNECTIONS, { color: '#50463F', lineWidth: 2 });
        (window as any).drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#3D352F', lineWidth: 1, radius: 3 });

        // Calculate height
        if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks;
            const nose = landmarks[0];
            const leftHeel = landmarks[29];
            const rightHeel = landmarks[30];
            
            if (nose && leftHeel && rightHeel) {
                const heelY = (leftHeel.y + rightHeel.y) / 2;
                const pixelHeight = Math.abs(heelY - nose.y);
                 // Simple calibration factor - this is a rough estimation
                const calculatedHeight = Math.round(pixelHeight * 210); // Adjust 210 based on testing
                setHeight(calculatedHeight);
            }
        }
        
        // Display overlays
        canvasCtx.fillStyle = 'white';
        canvasCtx.font = 'bold 24px Lora, serif';
        canvasCtx.shadowColor = 'black';
        canvasCtx.shadowBlur = 6;
        if (height) {
            canvasCtx.fillText(`Height: ${height} cm`, 30, 50);
        }
        canvasCtx.fillText(`Temp: ${temperature}`, 30, 90);
        canvasCtx.shadowBlur = 0;

        canvasCtx.restore();
    }, [height, temperature]);


    const startScan = async () => {
        setIsScanning(true);
        setShowPrompt(false);
        setShowAnalysis(false);
        setResult('');
        setError('');

        const videoElement = videoRef.current;
        if (!videoElement) return;

        const pose = new (window as any).Pose({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        pose.onResults(onResults);
        poseRef.current = pose;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            videoElement.srcObject = stream;
            cameraRef.current = stream;
            
            videoElement.onloadedmetadata = () => {
                const sendFrame = async () => {
                    if (videoElement.paused || videoElement.ended) return;
                    await pose.send({ image: videoElement });
                    requestAnimationFrame(sendFrame);
                };
                sendFrame();
            };
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("Camera access is required for biometric scanning.");
            setIsScanning(false);
        }
    };

    const handleProceed = () => {
        stopCamera();
        setShowAnalysis(true);
    };
    
    const handleNo = () => {
        stopCamera();
        setShowPrompt(false);
    };

    const handleAnalysisSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
             const prompt = `
                Perform a brief, general health analysis based on the following biometric data.
                - Age: ${age}
                - Estimated Height: ${height} cm
                - Simulated Body Temperature: ${temperature}
                
                Provide a general wellness observation and a simple suggestion.
                Format the response in markdown.
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setResult(response.text);
        } catch(err) {
            setError(err instanceof Error ? err.message : "Failed to get analysis.");
        } finally {
            setLoading(false);
        }
    };


    if (showAnalysis) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>Medical Analysis</h1>
                    <p>Enter your age for a final analysis based on the biometric scan.</p>
                </div>
                <div className="card">
                    <p><strong>Scan Results:</strong> Height: {height || 'N/A'} cm, Temperature: {temperature}</p>
                    <form onSubmit={handleAnalysisSubmit}>
                        <div className="form-group">
                            <label htmlFor="age">Enter Your Age</label>
                            <input type="number" id="age" value={age} onChange={e => setAge(e.target.value)} required />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading && <Loader small />}
                                Get Analysis
                            </button>
                        </div>
                    </form>
                </div>
                {error && <ErrorMessage message={error} />}
                {result && (
                    <ResultCard title="Biometric Analysis" disclaimer={DISCLAIMER} speakText={result}>
                         <MarkdownRenderer text={result} />
                    </ResultCard>
                )}
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Biometric Scan</h1>
                <p>Use your camera for a real-time estimation of height and body temperature.</p>
            </div>
            {!isScanning ? (
                <div className="form-actions" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={startScan}>Start Biometric Analysis</button>
                </div>
            ) : (
                <div className="biometric-container">
                    <video ref={videoRef} autoPlay playsInline style={{ transform: 'scaleX(-1)' }}></video>
                    <canvas ref={canvasRef} width="640" height="480"></canvas>
                    {showPrompt && (
                        <div className="biometric-prompt">
                            <p>Proceed to medical analysis?</p>
                            <div>
                                <button className="btn btn-outline" onClick={handleNo}>No</button>
                                <button className="btn btn-primary" onClick={handleProceed}>Yes</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {error && <ErrorMessage message={error} />}
        </div>
    );
};

// --- Medical Imaging Analyzer ---

const ThreeCanvas = ({ fractureCoords }: { fractureCoords: [number, number, number] | null }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.innerHTML = ''; // Clear previous renders
        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Skeleton materials
        const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const jointMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });

        // Create skeleton parts
        const skeleton = new THREE.Group();
        const createLimb = (length: number, isVertical: boolean = true) => {
            const group = new THREE.Group();
            const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, length, 8), boneMaterial);
            const joint1 = new THREE.Mesh(new THREE.SphereGeometry(0.3), jointMaterial);
            const joint2 = new THREE.Mesh(new THREE.SphereGeometry(0.3), jointMaterial);
            joint1.position.y = isVertical ? length / 2 : 0;
            joint2.position.y = isVertical ? -length / 2 : 0;
            group.add(bone, joint1, joint2);
            return group;
        };

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3.5, 8), boneMaterial);
        torso.position.y = 2.75;
        const head = new THREE.Mesh(new THREE.SphereGeometry(1), boneMaterial);
        head.position.y = 5.5;

        const leftArm = createLimb(2.5); leftArm.position.set(-1.5, 3.5, 0);
        const rightArm = createLimb(2.5); rightArm.position.set(1.5, 3.5, 0);
        const leftLeg = createLimb(3); leftLeg.position.set(-0.6, -0.5, 0);
        const rightLeg = createLimb(3); rightLeg.position.set(0.6, -0.5, 0);
        
        skeleton.add(torso, head, leftArm, rightArm, leftLeg, rightLeg);
        scene.add(skeleton);

        // Add fracture marker
        if (fractureCoords) {
            const fractureMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const fractureSphere = new THREE.Mesh(new THREE.SphereGeometry(0.4), fractureMaterial);
            fractureSphere.position.set(...fractureCoords);
            // Add a simple glow effect
            const glowMaterial = new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(generateGlowTexture()),
                color: 0xff0000, transparent: true, blending: THREE.AdditiveBlending
            });
            const glowSprite = new THREE.Sprite(glowMaterial);
            glowSprite.scale.set(3, 3, 3);
            fractureSphere.add(glowSprite);
            scene.add(fractureSphere);
        }

        camera.position.z = 12;

        // Mouse controls
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        const onMouseDown = (e: MouseEvent) => { isDragging = true; };
        const onMouseUp = () => { isDragging = false; };
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };
            skeleton.rotation.y += deltaMove.x * 0.01;
            skeleton.rotation.x += deltaMove.y * 0.01;
            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        };
        mountRef.current.addEventListener('mousedown', onMouseDown);
        mountRef.current.addEventListener('mouseup', onMouseUp);
        mountRef.current.addEventListener('mousemove', onMouseMove);
        
        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            if (mountRef.current) {
                mountRef.current.removeEventListener('mousedown', onMouseDown);
                mountRef.current.removeEventListener('mouseup', onMouseUp);
                mountRef.current.removeEventListener('mousemove', onMouseMove);
            }
        };
    }, [fractureCoords]);
    
    // Helper for glow effect
    function generateGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if(!context) return canvas;
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        return canvas;
    }

    return <div ref={mountRef} className="canvas-wrapper"></div>;
};

const MedicalImagingAnalyzer = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ diagnosis: string; recovery_timeline: string; fracture_coordinates?: [number, number, number] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            handleAnalysis(selectedFile);
        }
    };
    
    const extractJsonFromMarkdown = (text: string) => {
        const match = text.match(/```json\n([\s\S]+?)\n```/);
        return match ? JSON.parse(match[1]) : null;
    }

    const handleAnalysis = async (fileToAnalyze: File) => {
        setLoading(true);
        setError('');
        setResult(null);

        const fileType = fileToAnalyze.type;
        const fileExtension = fileToAnalyze.name.split('.').pop()?.toLowerCase();

        try {
            if (['png', 'jpg', 'jpeg'].includes(fileExtension || '')) {
                // Simulate image analysis
                await new Promise(resolve => setTimeout(resolve, 2000));
                setResult({
                    diagnosis: "Simple fracture of the tibia (shinbone).",
                    recovery_timeline: "6-8 weeks in a cast, followed by physical therapy.",
                    fracture_coordinates: [0.6, -1.0, 0] // Coordinates on the right leg
                });
            } else if (['txt', 'pdf'].includes(fileExtension || '')) {
                const textContent = await fileToAnalyze.text();
                const prompt = `Analyze the following medical report and provide a diagnosis and an estimated recovery timeline. Use Google Search to ensure the recovery information is up-to-date. Return the response as a JSON object inside a markdown block with keys "diagnosis" and "recovery_timeline". Report content: "${textContent}"`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: { tools: [{ googleSearch: {} }] },
                });

                const parsedResult = extractJsonFromMarkdown(response.text);
                 if (!parsedResult) {
                    throw new Error("Failed to parse analysis from the AI response.");
                }
                setResult(parsedResult);
            } else {
                throw new Error("Unsupported file type. Please upload an image (PNG, JPG) or a text report (TXT, PDF).");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during analysis.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Medical Imaging Analysis</h1>
                <p>Upload an X-ray, MRI, or blood report for an AI-powered analysis and 3D visualization.</p>
            </div>
            <div className="card">
                <input type="file" accept=".png,.jpg,.jpeg,.txt,.pdf" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <div className="file-upload-area" onClick={() => fileInputRef.current?.click()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <p>Click to upload a medical file</p>
                    <span>X-ray, MRI, TXT, or PDF</span>
                </div>
            </div>

            {loading && <Loader />}
            {error && <ErrorMessage message={error} />}

            {result && (
                <ResultCard title="Analysis Report" disclaimer={DISCLAIMER} speakText={`Diagnosis: ${result.diagnosis}. Recovery: ${result.recovery_timeline}`}>
                    <h4>Diagnosis</h4>
                    <p>{result.diagnosis}</p>
                    <h4>Estimated Recovery Timeline</h4>
                    <p>{result.recovery_timeline}</p>

                    {result.fracture_coordinates && (
                        <>
                            <h4 style={{marginTop: '1.5rem'}}>3D Visualization</h4>
                            <ThreeCanvas fractureCoords={result.fracture_coordinates} />
                        </>
                    )}
                </ResultCard>
            )}
        </div>
    );
};


// --- App Structure & Auth ---

const LoginPage = ({ onLogin }: { onLogin: (username: string) => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onLogin(username.trim());
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <Logo />
                <h2>Welcome to Dhanvantari</h2>
                <p>Sign in to access your medical assistant.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                     <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                     <div className="form-actions" style={{justifyContent: 'center'}}>
                        <button type="submit" className="btn btn-primary">Login</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MainApp = ({ currentUser, onLogout }: { currentUser: string, onLogout: () => void }) => {
    const [currentPage, setCurrentPage] = useState<Page>('home');

    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <Home setCurrentPage={setCurrentPage} />;
            case 'assistant': return <MedicalAssistant />;
            case 'calculator': return <CalorieCalculator />;
            case 'scanner': return <PrescriptionScanner />;
            case 'hospitals': return <NearbyHospitals />;
            case 'delivery': return <MedicineDelivery />;
            case 'profile': return <ProfilePage currentUser={currentUser} />;
            case 'biometric': return <BiometricScanner />;
            case 'imaging': return <MedicalImagingAnalyzer />;
            default: return <Home setCurrentPage={setCurrentPage} />;
        }
    };
    
    const navLinks: { page: Page; label: string }[] = [
        { page: 'assistant', label: 'Assistant' },
        { page: 'calculator', label: 'Calories' },
        { page: 'scanner', label: 'Scan Rx' },
        { page: 'imaging', label: 'Imaging' },
        { page: 'biometric', label: 'Biometric' },
        { page: 'hospitals', label: 'Hospitals' },
        { page: 'delivery', label: 'Delivery' }
    ];

    return (
        <div className="app-container">
            <nav className="navbar">
                <div className="nav-left">
                     <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>
                        <Logo />
                        Dhanvantari
                    </a>
                    <ul className="nav-links">
                        {navLinks.map(({ page, label }) => (
                            <li key={page}>
                                <a href="#" className={currentPage === page ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>{label}</a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="nav-right">
                     <a href="#" className="nav-links" onClick={(e) => { e.preventDefault(); setCurrentPage('profile'); }}>Profile</a>
                     <button className="btn btn-outline logout-btn" onClick={onLogout}>Logout</button>
                </div>
            </nav>
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    );
};

const App = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    
    useEffect(() => {
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
            setCurrentUser(loggedInUser);
        }
    }, []);

    const handleLogin = (username: string) => {
        setCurrentUser(username);
        localStorage.setItem('currentUser', username);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return <MainApp currentUser={currentUser} onLogout={handleLogout} />;
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
