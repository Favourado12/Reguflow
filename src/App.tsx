/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShieldCheck, 
  FileText, 
  LayoutDashboard, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Scale,
  BookOpen,
  ClipboardCheck,
  Building2,
  Info,
  User,
  Rocket,
  Target,
  ChevronRight,
  ChevronLeft,
  Settings,
  Lock,
  Globe,
  MessageSquare,
  CreditCard,
  Crown,
  Headset,
  Calendar,
  Clock,
  FileUp,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { auth, db, isFirebaseConfigured } from './lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, where, addDoc, orderBy, limit } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { FeedbackButtons } from './components/FeedbackButtons';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CACRegistrationForm } from './components/CACRegistrationForm';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const NIGERIAN_REG_CONTEXT = `
Role: Senior Nigerian Compliance Architect (2026 Focus). 
expertise: CAMA 2020, CBN Circulars, NITDA, NDPR, FCCPC Lending Guidelines, NITDA AI Ethical Framework.

Critical 2026 Nigerian Fintech Knowledge:
1. Automated AML Enforcement: Deadline June 10, 2026. All PSSPs, MMOs and Digital Banks must have real-time transaction monitoring and biometric liveness KYC APIs integrated.
2. Minimum Share Capital: ₦2B for MMOs (Mobile Money Operators), ₦100M for PSSP (Payment Service Solution Providers), ₦50M for Super Agents.
3. CAC Post-Incorporation: Annual returns and persons with significant control (PSC) filings are mandatory for Nigerian entities.
4. FCCPC Lending: Unregistered digital lenders face ₦100M+ fines under 2026 enforcement logic.
5. AI Governance (2026): All AI agents operating in the Nigerian financial sector must implement "Storage Guard" protocols, preventing autonomous deletion of transaction logs or user data.

Possible Fintech Challenges:
- High license fees and capital requirements (e.g., ₦2B for MMO).
- Rapidly changing CBN circulars (The "Policy Pivot" risk).
- Integration costs for 2026-standard security layers (AML APIs).
- Cross-border interoperability with AfCFTA (Aligning with Regional KYC standards).

Tone: Senior "Fixer" at a Global Consulting Firm.
Focus on NGN (Naira) penalties and local statutes.
`;

const INTERNATIONAL_REG_CONTEXT = `
You are ReguFlow Global, a Senior Regulatory Architect for intercontinental financial expansion in 2026.
Your mission is to aid Fintechs and Digital Banks in expanding beyond Nigeria into markets like the EU, UK, Kenya, and South Africa.

Critical 2026 Global Knowledge:
1. The EU AI Act (August 2, 2026): Full compliance mandatory for "High-Risk AI" in finance. Systems must have explainability, risk mitigation, and "Human-in-the-loop" (HITL) for destructive actions (like storage deletion).
2. AfCFTA Cross-Border: Mobile money interoperability and e-KYC standards for trade between African states.
3. UK/EU Open Banking: Financial Data Access (FiDA) regulations for 2026.
4. AI Agent Liability: Under the 2026 Global AI Liability Directive, entities are strictly liable for autonomous agent "misbehavior" (data loss, illegal transactions).
5. Delta Analysis: Comparing Nigerian regulatory setups against target country 2026 laws.

When engaging:
- Focus on EUR/USD/GBP and comparative law.
- Reference ESMA, FCA, AfCFTA Secretariat, and regional central banks.
- Tone: Senior "Fixer" at a Global Consulting Firm.
`;

// Types
type UserRole = 'Admin' | 'Business' | 'Guest';

interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  accessStatus: 'Pending' | 'Approved' | 'Rejected';
  isPremium: boolean;
  onboardingCompleted: boolean;
  businessProfile?: {
    name: string;
    industry: string;
    stage: string;
    location: string;
  };
  createdAt: string;
  cacRegistration?: any;
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [analyzerText, setAnalyzerText] = useState('');
  const [operationalContext, setOperationalContext] = useState('');
  const [businessType, setBusinessType] = useState('Fintech');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [roadmapResult, setRoadmapResult] = useState<any>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Monetization & Admin States
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const isAdmin = user?.email === 'eshietfavour23@gmail.com' || userProfile?.role === 'Admin';
  const isBusinessUser = userProfile?.role === 'Business' || isAdmin;
  
  const [appConfig, setAppConfig] = useState({
    requireConsultation: false,
    internationalEnabled: true,
    nationalEnabled: true
  });
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationType, setConsultationType] = useState<'National' | 'International'>('National');

  const getSystemContext = () => {
    return consultationType === 'National' ? NIGERIAN_REG_CONTEXT : INTERNATIONAL_REG_CONTEXT;
  };

  // Onboarding States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [businessProfile, setBusinessProfile] = useState({
    name: '',
    industry: 'Fintech',
    stage: 'Idea',
    location: 'Lagos'
  });

  const [showCACRegistration, setShowCACRegistration] = useState(false);
  const [isSubmittingCAC, setIsSubmittingCAC] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  // Removed static scheduledSessions state to use Firestore listener

  useEffect(() => {
    let unsubConfig: (() => void) | null = null;
    let unsubBookings: (() => void) | null = null;

    if (!isFirebaseConfigured) {
      // Local Storage Fallback Mode
      const guestUser = { 
        email: 'guest@reguflow.demo', 
        uid: 'guest_uid_123',
        isAnonymous: true 
      } as any;
      setUser(guestUser);
      setLoadingAuth(false);

      const savedProfile = localStorage.getItem('reguflow_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
        if (profile.businessProfile) {
          setBusinessProfile(profile.businessProfile);
          setBusinessType(profile.businessProfile.industry);
        }
        if (!profile.onboardingCompleted) {
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(true);
      }

      const savedConfig = localStorage.getItem('reguflow_config');
      if (savedConfig) {
        setAppConfig(JSON.parse(savedConfig));
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      
      if (currentUser) {
        const isUserAdmin = currentUser.email === 'eshietfavour23@gmail.com';

        // Set up Users listener if admin
        if (isUserAdmin) {
          const usersCol = collection(db, 'users');
          onSnapshot(usersCol, (snap) => {
            setAllUsers(snap.docs.map(d => d.data()));
          });
        }

        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            role: isUserAdmin ? 'Admin' : 'Business',
            createdAt: new Date().toISOString(),
            onboardingCompleted: false,
            isPremium: false,
            accessStatus: isUserAdmin ? 'Approved' : 'Pending'
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
          if (!isUserAdmin) setShowOnboarding(true);
        } else {
          const userData = userSnap.data() as UserProfile;
          setUserProfile(userData);
          if (userData.businessProfile) {
            setBusinessProfile(userData.businessProfile);
            setBusinessType(userData.businessProfile.industry);
          }
          if (!userData.onboardingCompleted) {
            setShowOnboarding(true);
          }
        }

        // Listen to global app config only when authenticated
        const configRef = doc(db, 'config', 'global');
        unsubConfig = onSnapshot(configRef, (snapshot) => {
          if (snapshot.exists()) {
            setAppConfig(snapshot.data() as any);
          } else if (isUserAdmin) {
            // Document doesn't exist, create it as admin
            setDoc(configRef, {
              requireConsultation: false,
              internationalEnabled: true,
              nationalEnabled: true
            }).catch(err => console.error("Initial config creation failed:", err));
          }
        }, (error) => {
          if (error.code !== 'permission-denied') {
            console.error("Config listener error:", error);
          }
        });

        // Listen to Bookings
        const bookingsCol = collection(db, 'bookings');
        let bookingsQuery;
        
        if (isUserAdmin) {
          // Admin sees everything
          bookingsQuery = query(bookingsCol, orderBy('createdAt', 'desc'), limit(50));
        } else {
          // User sees only their own
          bookingsQuery = query(bookingsCol, where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
        }

        unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          if (isUserAdmin) {
            setAllBookings(docs);
          }
          setScheduledSessions(docs.filter(d => (d as any).userId === currentUser.uid || isUserAdmin));
        });
      } else {
        setUserProfile(null);
        setScheduledSessions([]);
        setAllBookings([]);
        if (unsubConfig) { unsubConfig(); unsubConfig = null; }
        if (unsubBookings) { unsubBookings(); unsubBookings = null; }
      }
    });

    return () => {
      unsubscribe();
      if (unsubConfig) unsubConfig();
      if (unsubBookings) unsubBookings();
    };
  }, []);

  const handleToggleConfig = async (key: string, value: boolean) => {
    const newConfig = { ...appConfig, [key]: value };
    setAppConfig(newConfig);

    if (!isFirebaseConfigured || !isAdmin || !db) {
      localStorage.setItem('reguflow_config', JSON.stringify(newConfig));
      toast.success(`Local setting updated: ${key}`);
      return;
    }

    try {
      const configRef = doc(db, 'config', 'global');
      // Use setDoc with merge to ensure document is created if it doesn't exist
      await setDoc(configRef, { [key]: value }, { merge: true });
      toast.success(`Global setting updated: ${key}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update config. Verify admin permissions.");
    }
  };

  const handleRequestConsultation = async (type: 'National' | 'International') => {
    setConsultationType(type);
    if (appConfig.requireConsultation && !userProfile?.isPremium && !isAdmin) {
      setShowConsultationModal(true);
    } else {
      setActiveTab('consultation');
      navigate('/dashboard');
      toast.info(`Accessing ${type} Compliance module...`);
    }
  };

  const handleBookConsultation = () => {
    setShowConsultationModal(false);
    setActiveTab('consultation');
    navigate('/dashboard');
    toast.success("Redirecting to consultation booking...");
  };

  const handleBookExpert = async (expert: any) => {
    if (!user) {
      toast.error("Please sign in to book a session.");
      return;
    }

    const bookingData = {
      userId: user.uid,
      userEmail: user.email,
      expertName: expert.name,
      type: consultationType,
      date: new Date(Date.now() + 86400000 * 2).toLocaleDateString(), // Tomorrow + 1
      time: "10:00 AM",
      status: "Pending Approval",
      createdAt: new Date().toISOString()
    };

    try {
      if (isFirebaseConfigured && db) {
        await addDoc(collection(db, 'bookings'), bookingData);
      } else {
        const localSessions = [...scheduledSessions, { ...bookingData, id: Math.random().toString(36).substr(2, 9) }];
        setScheduledSessions(localSessions);
        // Also save to profile for persistence
        const updatedProfile = { ...userProfile, scheduledSessions: localSessions };
        localStorage.setItem('reguflow_profile', JSON.stringify(updatedProfile));
        setUserProfile(updatedProfile);
      }
      setSelectedExpert(null);
      toast.success(`Booking request sent to admin! Check 'Scheduled Sessions' for status.`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit booking request.");
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'Confirmed' | 'Rejected') => {
    if (!isAdmin || !db) return;
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status: newStatus });
      toast.success(`Booking ${newStatus.toLowerCase()} successfully.`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update booking status.");
    }
  };

  const handleUpdateUserStatus = async (uid: string, newStatus: string) => {
    if (!isAdmin || !db) return;
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { 
        accessStatus: newStatus,
        isPremium: newStatus === 'Approved'
      });
      toast.success(`User access updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user status.");
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: UserRole) => {
    if (!isAdmin || !db) return;
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user role.");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploadingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setAnalyzerText(text);
      setIsUploadingFile(false);
      toast.success(`Loaded content from ${file.name}`);
    };
    reader.onerror = () => {
      setIsUploadingFile(false);
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleCompleteOnboarding = async () => {
    const updatedProfile = {
      ...businessProfile,
      onboardingCompleted: true,
      businessProfile
    };

    if (!isFirebaseConfigured || !user) {
      localStorage.setItem('reguflow_profile', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      setShowOnboarding(false);
      toast.success("Onboarding complete (Saved locally)!");
      setBusinessType(businessProfile.industry);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        businessProfile,
        onboardingCompleted: true
      });
      setShowOnboarding(false);
      toast.success("Onboarding complete! Welcome to ReguFlow.");
      setBusinessType(businessProfile.industry);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile.");
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      toast.warning("Firebase not configured or initialized. Using Guest Mode.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign in.");
    }
  };

  const handleSignOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setUserProfile(null);
      localStorage.removeItem('reguflow_profile');
      toast.info("Signed out (Guest session cleared).");
      return;
    }
    try {
      await signOut(auth);
      toast.info("Signed out.");
    } catch (error) {
      console.error(error);
      toast.error("Sign out failed.");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResult(""); 
    try {
      const locationContext = consultationType === 'National' ? 'Nigerian' : 'International';
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Search for and summarize 2026 ${locationContext} regulations for: ${searchQuery}`,
        config: { 
          systemInstruction: getSystemContext() + "\nFocus on low-latency, rapid response. Be concise."
        }
      });
      
      setSearchResult(response.text || "No results found.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch regulatory data.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const newUserMsg = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [...history, { role: 'user', parts: [{ text: chatInput }] }],
        config: {
          systemInstruction: getSystemContext()
        }
      });

      setChatMessages(prev => [...prev, { role: 'model', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error(error);
      toast.error("Chat connection failed.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCACComplete = async (data: any) => {
    setIsSubmittingCAC(true);
    try {
      const registrationData = {
        ...data,
        status: 'Pending Reservation',
        submittedAt: new Date().toISOString()
      };

      if (!isFirebaseConfigured || !user) {
        const localProfile = JSON.parse(localStorage.getItem('reguflow_profile') || '{}');
        const updatedProfile = { 
          ...localProfile, 
          cacRegistration: registrationData 
        };
        localStorage.setItem('reguflow_profile', JSON.stringify(updatedProfile));
        setUserProfile(updatedProfile);
      } else {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          cacRegistration: registrationData
        });
      }

      toast.success("Registration progress saved to your profile!");
      setShowCACRegistration(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save registration data.");
    } finally {
      setIsSubmittingCAC(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analyzerText) return;
    setIsAnalyzing(true);
    try {
      const locationText = consultationType === 'National' 
        ? `in Nigeria. System Instruction Update: You MUST perform deep reasoning on the potential fine amounts (Capped at ₦100M).`
        : `for international expansion. System Instruction Update: You MUST perform deep reasoning on international fines like EU GDPR/AI Act (up to 7% Global Turnover).`;

      const prompt = `
        Perform a high-stakes Regulatory Risk Scan on the following business description for a ${businessType} enterprise ${locationText}
        
        Document/Description:
        ${analyzerText}
        
        Provide the output in JSON format with the following structure:
        {
          "score": number (0-100),
          "status": "Compliant" | "Partially Compliant" | "Non-Compliant",
          "findings": string[],
          "risks": string[],
          "recommendations": string[]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          systemInstruction: getSystemContext(),
          responseMimeType: "application/json"
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      setAnalysisResult(data);
    } catch (error) {
      console.error(error);
      toast.error("Analysis failed. Our audit engine is being optimized.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRoadmap = async (type: string) => {
    setIsGeneratingRoadmap(true);
    setBusinessType(type);
    setRoadmapResult(null);
    try {
      const locationTag = consultationType === 'National' ? 'in Nigeria' : 'for International Expansion';
      const authorityExamples = consultationType === 'National' 
        ? 'CAC, CBN' 
        : 'ESMA, AfCFTA Secretariat, FCA';

      const prompt = `
        Generate a detailed step-by-step regulatory compliance roadmap for starting a ${type} business ${locationTag}.
        
        Tailor this roadmap specifically to the following 2026 context:
        - Business Industry: ${businessProfile.industry || type}
        - Business Stage: ${businessProfile.stage || 'Idea'}
        - Location: ${businessProfile.location || 'Lagos'}
        - Additional Operational Context: ${operationalContext || 'None provided'}
        - 2026 Specifics: Include the June 10, 2026 Automated AML roadmap deadline (if Nigerian Fintech), AfCFTA Digital Trade Protocol compliance, and Eu AI Act transparency for high-risk finance AI.
        
        Include specific milestones like relevant agency registrations, tax setup, industry-specific licenses, and data protection (${consultationType === 'National' ? 'NITDA' : 'GDPR/FiDA'}).
        
        Provide the output in JSON format with the following structure:
        {
          "title": "Tailored Roadmap Title",
          "steps": [
            {
              "id": 1,
              "title": "Step Title",
              "description": "Detailed description of what to do, tailored to the context provided",
              "authority": "Relevant Agency (e.g., ${authorityExamples})",
              "estimatedTime": "e.g., 2-4 weeks",
              "priority": "High" | "Medium" | "Low"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: { 
          systemInstruction: getSystemContext(),
          responseMimeType: "application/json"
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      setRoadmapResult(data);
    } catch (error) {
      console.error(error);
      toast.error("Roadmap generation failed.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Initializing ReguFlow Master Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <Toaster position="top-right" />
      
      {/* Onboarding Modal */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="animate-bounce" size={24} />
              <span className="text-sm font-medium uppercase tracking-wider opacity-80">Onboarding</span>
            </div>
            <DialogTitle className="text-2xl font-bold text-white">Welcome to ReguFlow</DialogTitle>
            <DialogDescription className="text-emerald-100">
              Let's set up your business profile to personalize your experience.
            </DialogDescription>
            <div className="mt-6">
              <div className="flex justify-between text-xs mb-2">
                <span>Step {onboardingStep} of 3</span>
                <span>{Math.round((onboardingStep / 3) * 100)}% Complete</span>
              </div>
              <Progress value={(onboardingStep / 3) * 100} className="h-1.5 bg-emerald-800" />
            </div>
          </div>

          <div className="p-8 bg-white">
            <AnimatePresence mode="wait">
              {onboardingStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="biz-name">Business Name</Label>
                      <Input 
                        id="biz-name" 
                        placeholder="Enter your business name" 
                        value={businessProfile.name}
                        onChange={(e) => setBusinessProfile({...businessProfile, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <RadioGroup 
                        value={businessProfile.industry} 
                        onValueChange={(v) => setBusinessProfile({...businessProfile, industry: v})}
                        className="grid grid-cols-2 gap-4"
                      >
                        {['Fintech', 'E-commerce', 'HealthTech', 'AgriTech'].map((item) => (
                          <div key={item} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <RadioGroupItem value={item} id={item} />
                            <Label htmlFor={item} className="cursor-pointer flex-1">{item}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Business Stage</Label>
                      <RadioGroup 
                        value={businessProfile.stage} 
                        onValueChange={(v) => setBusinessProfile({...businessProfile, stage: v})}
                        className="grid grid-cols-1 gap-2"
                      >
                        {['Idea', 'Early Stage', 'Growth', 'Established'].map((item) => (
                          <div key={item} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <RadioGroupItem value={item} id={item} />
                            <Label htmlFor={item} className="cursor-pointer flex-1">{item}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-loc">Primary Location</Label>
                      <select 
                        id="biz-loc"
                        className="w-full p-2 rounded-md border bg-white"
                        value={businessProfile.location}
                        onChange={(e) => setBusinessProfile({...businessProfile, location: e.target.value})}
                      >
                        <option>Lagos</option>
                        <option>Abuja</option>
                        <option>Port Harcourt</option>
                        <option>Kano</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center py-4">
                    <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">You're all set!</h3>
                    <p className="text-slate-500 text-sm">
                      We've tailored ReguFlow for <strong>{businessProfile.name || 'your business'}</strong> in the <strong>{businessProfile.industry}</strong> sector.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
                      <p className="text-xs text-slate-600">Use <strong>Intelligent Search</strong> to find specific regulations.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
                      <p className="text-xs text-slate-600">Run a <strong>Compliance Audit</strong> on your business documents.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
                      <p className="text-xs text-slate-600">Follow your custom <strong>Compliance Roadmap</strong>.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={() => setOnboardingStep(s => Math.max(1, s - 1))}
              disabled={onboardingStep === 1}
              className="gap-2"
            >
              <ChevronLeft size={16} /> Back
            </Button>
            {onboardingStep < 3 ? (
              <Button 
                onClick={() => setOnboardingStep(s => s + 1)}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                Next <ChevronRight size={16} />
              </Button>
            ) : (
              <Button 
                onClick={handleCompleteOnboarding}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                Get Started <Rocket size={16} />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Consultation Modal */}
      <Dialog open={showConsultationModal} onOpenChange={setShowConsultationModal}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <MessageSquare size={24} />
            </div>
            <DialogTitle className="text-2xl font-bold">Expert Consultation Required</DialogTitle>
            <DialogDescription>
              Full access to {consultationType} Compliance modules requires a premium consultation with our regulatory experts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-sm mb-2">What's included:</h4>
              <ul className="space-y-2">
                <li className="text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" /> 1-on-1 session with a Senior Compliance Officer
                </li>
                <li className="text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Full {consultationType} License Roadmap
                </li>
                <li className="text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Document verification and pre-audit
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-emerald-100 bg-emerald-50/50">
              <div>
                <p className="text-xs font-medium text-emerald-800">Consultation Fee</p>
                <p className="text-2xl font-bold text-emerald-900">₦150,000 <span className="text-xs font-normal text-slate-500">/ session</span></p>
              </div>
              <Badge className="bg-emerald-600">Premium</Badge>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowConsultationModal(false)} className="flex-1">Maybe Later</Button>
            <Button onClick={handleBookConsultation} className="bg-emerald-600 hover:bg-emerald-700 flex-1 gap-2">
              Book Consultation <ArrowRight size={16} />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <Scale size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-emerald-900">Regu<span className="text-emerald-600">Flow</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Documentation</a>
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-emerald-700 hover:bg-emerald-50 gap-2"
                onClick={() => navigate('/admin')}
              >
                <Settings size={16} /> Admin
              </Button>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">{user.email}</span>
                <Button variant="outline" onClick={handleSignOut} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">Sign Out</Button>
              </div>
            ) : (
              <Button onClick={handleGoogleSignIn} className="bg-emerald-600 hover:bg-emerald-700 text-white">Sign In</Button>
            )}
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={
          <main className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <section className="mb-12 text-center md:text-left md:flex md:items-center md:justify-between gap-12">
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1">
                    Your Regulatory Compliance Partner
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                    Regulatory Compliance, <span className="text-emerald-600">Simplified.</span>
                  </h1>
                  <p className="text-lg text-slate-600 mb-8 max-w-xl">
                    {consultationType === 'National' 
                      ? 'Navigate CAMA, NITDA, and CBN regulations with ease. Our AI engine provides real-time compliance intelligence for Nigerian businesses.'
                      : 'Navigate intercontinental trade protocols, ESMA, and AfCFTA standards. Expand your business globally with AI-powered foresight.'}
                  </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {(!userProfile || userProfile.accessStatus !== 'Approved') && !isAdmin ? (
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 px-8" onClick={handleGoogleSignIn}>
                  Get Started - Request Approval <ArrowRight size={18} />
                </Button>
              ) : (
                <>
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 px-8" onClick={() => handleRequestConsultation('National')}>
                    National Compliance <ArrowRight size={18} />
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 px-8 border-slate-200 gap-2" onClick={() => handleRequestConsultation('International')}>
                    <Globe size={18} /> International Expansion
                  </Button>
                </>
              )}
            </div>
                </motion.div>
              </div>
              <div className="md:w-1/2 mt-12 md:mt-0">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 opacity-20 blur-xl"></div>
                  <Card className="relative border-emerald-100 shadow-2xl overflow-hidden">
                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-400"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                        <div className="h-3 w-3 rounded-full bg-green-400"></div>
                        <div className="ml-2 h-4 w-32 rounded-md bg-emerald-100"></div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-8 w-3/4 rounded-md bg-slate-100"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full rounded-md bg-slate-50"></div>
                          <div className="h-4 w-full rounded-md bg-slate-50"></div>
                          <div className="h-4 w-2/3 rounded-md bg-slate-50"></div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <div className="h-10 w-24 rounded-md bg-emerald-600/20"></div>
                          <div className="h-10 w-24 rounded-md bg-emerald-600"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-12 grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                    <Search size={24} />
                  </div>
                  <CardTitle>Intelligent Search</CardTitle>
                  <CardDescription>
                    {consultationType === 'National' 
                      ? 'Find any Nigerian regulation instantly with AI-powered semantic search.'
                      : 'Search global treaties, regional tax laws, and international trade protocols.'}
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                    <ShieldCheck size={24} />
                  </div>
                  <CardTitle>Compliance Audit</CardTitle>
                  <CardDescription>Upload your business documents for an instant AI-driven compliance analysis.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                    <LayoutDashboard size={24} />
                  </div>
                  <CardTitle>Growth Roadmap</CardTitle>
                  <CardDescription>Get a step-by-step regulatory roadmap tailored to your business model.</CardDescription>
                </CardHeader>
              </Card>
            </section>
          </main>
        } />
        <Route path="/admin" element={
          isAdmin ? (
            <main className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Admin Control Center</h1>
                  <p className="text-slate-600">Manage platform monetization and global compliance toggles.</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-1">
                  System Admin
                </Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="border-emerald-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard size={16} className="text-emerald-600" /> Monetization Toggle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Consultation</Label>
                        <p className="text-[10px] text-slate-500">Prompt users for payment/consultation</p>
                      </div>
                      <Switch 
                        checked={appConfig.requireConsultation} 
                        onCheckedChange={(v) => handleToggleConfig('requireConsultation', v)} 
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Scale size={16} className="text-blue-600" /> National Module
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enabled</Label>
                        <p className="text-[10px] text-slate-500">Toggle Nigerian compliance features</p>
                      </div>
                      <Switch 
                        checked={appConfig.nationalEnabled} 
                        onCheckedChange={(v) => handleToggleConfig('nationalEnabled', v)} 
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Globe size={16} className="text-purple-600" /> International Module
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enabled</Label>
                        <p className="text-[10px] text-slate-500">Toggle cross-border compliance features</p>
                      </div>
                      <Switch 
                        checked={appConfig.internationalEnabled} 
                        onCheckedChange={(v) => handleToggleConfig('internationalEnabled', v)} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isAdmin && (
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="md:col-span-2 border-emerald-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-emerald-50/50">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-600" size={20} />
                        <div>
                          <CardTitle className="text-lg">Project Implementation Progress</CardTitle>
                          <CardDescription>Verified status of requested features (April 2026 Update)</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { name: "Sidebar Navigation Refactor", status: "Completed", date: "April 18" },
                          { name: "AI Feedback Mechanism", status: "Implemented", date: "April 18" },
                          { name: "Tailored Compliance Roadmaps", status: "Functional", date: "April 17" },
                          { name: "Document Upload Analyzer", status: "Implemented", date: "April 17" },
                          { name: "International Expansion Audit", status: "Live", date: "April 16" },
                          { name: "User Access Control (Pending/Approved)", status: "Active", date: "April 16" },
                          { name: "Expert Consultation Booking", status: "Refined", date: "Today" },
                          { name: "Master Admin Role Recognition", status: "Live", date: "Today" }
                        ].map((feature, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                            <span className="text-xs font-bold text-slate-700">{feature.name}</span>
                            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">{feature.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-100 shadow-sm bg-blue-50/20">
                    <CardHeader>
                      <CardTitle className="text-lg">System Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Core Logic</span>
                        <span className="text-emerald-600 animate-pulse font-mono font-bold font-mono">STABLE</span>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">AI Engine</span>
                        <span className="text-emerald-600 font-bold font-mono">99.9%</span>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-blue-100">
                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Admin Greeting</p>
                        <p className="text-sm font-bold text-slate-700">Welcome, Favor Eshet</p>
                        <p className="text-[10px] text-slate-500 italic">2026 Regulatory Architect Mode Active</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar size={20} className="text-emerald-600" /> Consultation Bookings
                  </CardTitle>
                  <CardDescription>Review and approve pending expert consultation requests.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User / Date</TableHead>
                        <TableHead>Expert / Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBookings.length > 0 ? (
                        allBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{booking.userEmail}</span>
                                <span className="text-[10px] text-slate-400">{booking.date} at {booking.time}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{booking.expertName}</span>
                                <Badge variant="outline" className="w-fit text-[10px] uppercase h-5">{booking.type}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                booking.status === 'Rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                              }>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {booking.status === 'Pending Approval' && (
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => handleUpdateBookingStatus(booking.id!, 'Rejected')}
                                  >
                                    Reject
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleUpdateBookingStatus(booking.id!, 'Confirmed')}
                                  >
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                            No active booking requests found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Access Management</CardTitle>
                  <CardDescription>Review and approve users to unlock the premium app features.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User / Details</TableHead>
                        <TableHead>Business / Industry</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Access Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.filter(u => u.email !== 'eshietfavour23@gmail.com').map((u) => (
                        <TableRow key={u.uid}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{u.email}</span>
                              <span className="text-[10px] text-slate-400">UID: {u.uid.substring(0, 8)}...</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{u.businessProfile?.name || 'N/A'}</span>
                              <span className="text-[10px] text-slate-500 uppercase">{u.businessProfile?.industry || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <select 
                              className="text-xs border rounded px-1 bg-white"
                              value={u.role || 'Business'}
                              onChange={(e) => handleUpdateUserRole(u.uid, e.target.value as UserRole)}
                            >
                              <option value="Admin">Admin</option>
                              <option value="Business">Business</option>
                              <option value="Guest">Guest</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              u.accessStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                              u.accessStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }>
                              {u.accessStatus || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {u.accessStatus !== 'Rejected' && (
                                <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600" onClick={() => handleUpdateUserStatus(u.uid, 'Rejected')}>
                                  Reject
                                </Button>
                              )}
                              {u.accessStatus !== 'Approved' && (
                                <Button size="sm" className="h-8 bg-emerald-600" onClick={() => handleUpdateUserStatus(u.uid, 'Approved')}>
                                  Approve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </main>
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
              <Lock size={48} className="text-slate-300 mb-4" />
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-slate-500">You do not have permission to view the Admin Center.</p>
              <Button onClick={() => navigate('/')} className="mt-4">Return Home</Button>
            </div>
          )
        } />
        <Route path="/dashboard" element={
          (!isBusinessUser && !isAdmin) || (userProfile?.accessStatus !== 'Approved' && !isAdmin) ? (
            <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <Lock size={40} className="text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">{!isBusinessUser ? 'Business Account Required' : 'Access Pending'}</h1>
              <p className="text-slate-600 max-w-md mb-8">
                {!isBusinessUser 
                  ? "Your current role does not have access to the Compliance Dashboard. This feature is reserved for Business and Expert users."
                  : `Your request to access the ReguFlow premium dashboard is currently being reviewed by Favor Eshet (Fintech & International Expert). Once approved, you will have full access.`
                }
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate('/')}>Return to Landing Page</Button>
                <Button className="bg-emerald-600" onClick={() => window.location.reload()}>Check Status</Button>
              </div>
            </main>
          ) : (
            <div className="flex min-h-screen bg-slate-50">
              {/* Sidebar Navigation */}
              <aside className="w-64 bg-white border-r flex flex-col hidden md:flex sticky top-0 h-screen">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
                    <Scale className="text-emerald-600" size={24} />
                    <span className="text-xl font-bold text-emerald-900">ReguFlow</span>
                  </div>
                  <nav className="space-y-1">
                    {[
                      { id: 'search', label: 'AI Search', icon: Search },
                      { id: 'analyze', label: 'Audit Analyzer', icon: ShieldCheck },
                      { id: 'roadmap', label: 'Compliance Roadmap', icon: LayoutDashboard },
                      { id: 'consultation', label: 'Expert Booking', icon: Headset },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === item.id 
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </button>
                    ))}
                    {isAdmin && (
                      <button
                        onClick={() => navigate('/admin')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors mt-4"
                      >
                        <Settings size={18} />
                        Admin Center
                      </button>
                    )}
                  </nav>
                </div>
                
                <div className="mt-auto p-6 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Compliance Mode</p>
                    <div className="flex gap-1 p-1 bg-slate-200 rounded-lg">
                      <button 
                        onClick={() => setConsultationType('National')}
                        className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${consultationType === 'National' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                      >
                        National
                      </button>
                      <button 
                        onClick={() => setConsultationType('International')}
                        className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${consultationType === 'International' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-50'}`}
                      >
                        Global
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-2 py-3 border-t">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                      {user?.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold truncate">{user?.email}</p>
                      <button onClick={handleSignOut} className="text-[10px] text-red-500 hover:underline">Sign Out</button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Mobile Navigation (Floating) */}
              <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border shadow-2xl rounded-full px-6 py-3 flex gap-8 items-center">
                 <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'text-emerald-600' : 'text-slate-400'}><Search size={20} /></button>
                 <button onClick={() => setActiveTab('analyze')} className={activeTab === 'analyze' ? 'text-emerald-600' : 'text-slate-400'}><ShieldCheck size={20} /></button>
                 <button onClick={() => setActiveTab('roadmap')} className={activeTab === 'roadmap' ? 'text-emerald-600' : 'text-slate-400'}><LayoutDashboard size={20} /></button>
                 <button onClick={() => setActiveTab('consultation')} className={activeTab === 'consultation' ? 'text-emerald-600' : 'text-slate-400'}><Headset size={20} /></button>
              </div>

              {/* Main Dashboard Content */}
              <main className="flex-1 overflow-y-auto px-4 py-8 md:px-10">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                      {isAdmin ? 'Master Admin Console' : 'Compliance Dashboard'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                      {isAdmin ? 'Welcome Favor, managing global regulatory systems.' : `Managing ${consultationType} regulatory requirements.`}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400 font-medium">Business Environment</p>
                    <Badge variant="outline" className={`mt-1 ${consultationType === 'National' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-purple-200 text-purple-700 bg-purple-50'}`}>
                      {consultationType === 'National' ? '🇳🇬 Nigeria (CAMA/CBN)' : '🌐 Global (EU AI Act/AfCFTA)'}
                    </Badge>
                  </div>
                </div>

                <div className="max-w-5xl mx-auto space-y-6">
                  {activeTab === 'search' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Card className="border-emerald-100/50 shadow-sm">
                        <CardHeader>
                          <CardTitle>Search Regulations</CardTitle>
                          <CardDescription>
                            {consultationType === 'National' 
                              ? 'Ask about CAMA, CBN, or NITDA regulations.' 
                              : 'Ask about ESMA, GDPR, AfCFTA, or International Trade laws.'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="e.g., What are the requirements for a Fintech license?" 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={isSearching} className="bg-emerald-600 hover:bg-emerald-700">
                              {isSearching ? <Loader2 className="animate-spin" size={18} /> : "Search"}
                            </Button>
                          </div>
                          {searchResult && (
                            <div className="space-y-4 mt-6">
                              <ScrollArea className="h-[400px] w-full rounded-md border p-6 bg-white prose prose-emerald max-w-none whitespace-pre-wrap text-sm border-emerald-50">
                                {searchResult}
                              </ScrollArea>
                              <FeedbackButtons id="search-result-dash" context="Search Recommendation" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'analyze' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Card className="border-emerald-100/50 shadow-sm">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>Compliance Analyzer</CardTitle>
                              <CardDescription>Paste text or upload a document for an automated AI audit.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileUpload}
                                accept=".txt,.doc,.docx,.pdf"
                              />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingFile}
                              >
                                {isUploadingFile ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
                                Upload Document
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label>Document Text / Content</Label>
                              <textarea 
                                className="w-full min-h-[200px] p-4 rounded-xl border bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm leading-relaxed"
                                placeholder={consultationType === 'National' 
                                  ? "E.g. Business plan for a PSSP payment switch in Nigeria..." 
                                  : "E.g. Strategy for expansion into the EU digital market..."}
                                value={analyzerText}
                                onChange={(e) => setAnalyzerText(e.target.value)}
                              />
                            </div>
                            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl">
                              {isAnalyzing ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                              Run Compliance Audit
                            </Button>
                          </div>

                          {analysisResult && (
                            <div className="mt-8 space-y-6">
                              <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <div>
                                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Health Score</p>
                                  <p className="text-5xl font-bold text-emerald-600">{analysisResult.score}%</p>
                                </div>
                                <Badge className={`px-4 py-1.5 ${
                                  analysisResult.status === 'Compliant' ? 'bg-emerald-500' : 
                                  analysisResult.status === 'Partially Compliant' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}>
                                  {analysisResult.status}
                                </Badge>
                              </div>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4 bg-white p-6 rounded-2xl border">
                                  <h4 className="font-bold flex items-center gap-2 text-slate-900 leading-none">
                                    <CheckCircle2 className="text-emerald-500" size={18} /> 
                                    Key Findings
                                  </h4>
                                  <ul className="space-y-3">
                                    {analysisResult.findings?.map((f: string, i: number) => (
                                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                                        <span className="text-emerald-300 font-bold">•</span> {f}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="space-y-4 bg-white p-6 rounded-2xl border">
                                  <h4 className="font-bold flex items-center gap-2 text-slate-900 leading-none">
                                    <AlertCircle className="text-red-500" size={18} /> 
                                    Identified Risks
                                  </h4>
                                  <ul className="space-y-3">
                                    {analysisResult.risks?.map((r: string, i: number) => (
                                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                                        <span className="text-red-300 font-bold">•</span> {r}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              <FeedbackButtons id="analysis-result-dash" context="Compliance Audit" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {activeTab === 'roadmap' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Card className="border-emerald-100/50 shadow-sm">
                        <CardHeader className="flex items-center justify-between">
                          <div>
                            <CardTitle>Compliance Roadmap</CardTitle>
                            <CardDescription>Tailored regulatory blueprints based on your business profile.</CardDescription>
                          </div>
                          {consultationType === 'National' && (
                            <Button onClick={() => setShowCACRegistration(true)} className="bg-blue-600 hover:bg-blue-700">
                              <Plus className="mr-2" size={16} /> New CAC Filing
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <Label>Operational Context (Optional)</Label>
                            <textarea 
                              className="w-full min-h-[100px] p-4 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
                              placeholder="Describe your target market..."
                              value={operationalContext}
                              onChange={(e) => setOperationalContext(e.target.value)}
                            />
                            
                            <Label>Industry Template</Label>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                              {['Fintech', 'E-commerce', 'HealthTech', 'AgriTech', 'AI Systems'].map((type) => (
                                <Button 
                                  key={type} 
                                  variant="outline" 
                                  className={`h-24 flex-col gap-2 transition-all rounded-2xl ${businessType === type && isGeneratingRoadmap ? 'border-emerald-600 bg-emerald-50' : 'hover:border-emerald-200 shadow-sm'}`}
                                  onClick={() => handleGenerateRoadmap(type)}
                                  disabled={isGeneratingRoadmap}
                                >
                                  {isGeneratingRoadmap && businessType === type ? (
                                    <Loader2 size={24} className="animate-spin text-emerald-600" />
                                  ) : (
                                    <Building2 size={24} className={businessType === type ? 'text-emerald-600' : 'text-slate-400'} />
                                  )}
                                  <span className="font-bold">{isGeneratingRoadmap && businessType === type ? 'Building AI Roadmap...' : type}</span>
                                </Button>
                              ))}
                            </div>
                          </div>

                          {roadmapResult && (
                            <div className="mt-12 space-y-8 pt-8 border-t">
                              <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{roadmapResult.title || `${businessType} Roadmap`}</h3>
                                <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200 text-slate-600">
                                  <FileText size={16} className="mr-2" /> Export
                                </Button>
                              </div>

                              <div className="space-y-12 relative px-4 sm:px-0">
                                {roadmapResult.steps?.map((step: any, index: number) => (
                                  <motion.div 
                                    key={step.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    className="flex flex-col sm:flex-row gap-6 relative"
                                  >
                                    <div className="flex flex-col items-center">
                                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg z-10 shrink-0">
                                        {index + 1}
                                      </div>
                                      {index < roadmapResult.steps.length - 1 && (
                                        <div className="w-1 h-full bg-slate-100 absolute top-10" />
                                      )}
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full transition-all hover:shadow-md">
                                      <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
                                        <Badge className={`border-none ${
                                          step.priority === 'High' ? 'bg-red-100 text-red-700' :
                                          step.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                        }`}>{step.priority} Priority</Badge>
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Timeline: {step.estimatedTime}</span>
                                      </div>
                                      <h4 className="text-lg font-extrabold text-slate-900 mb-2">{step.title}</h4>
                                      <p className="text-sm text-slate-600 mb-6 leading-relaxed">{step.description}</p>
                                      <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
                                          <Scale size={14} /> {step.authority}
                                        </div>
                                      </div>
                                      <FeedbackButtons id={`roadmap-step-dash-${index}`} context="Roadmap Step" />
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'consultation' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Card className="border-emerald-100/50 shadow-sm">
                        <CardHeader>
                          <CardTitle>Expert Consultation</CardTitle>
                          <CardDescription>Book session with Favor Eshet or Barr. Samuel Eshet.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border">
                                <h4 className="font-bold flex items-center gap-2 text-slate-900">
                                  <Calendar className="text-emerald-600" size={20} /> My Sessions
                                </h4>
                                {scheduledSessions.length > 0 ? (
                                  <div className="space-y-3">
                                    {scheduledSessions.map((session) => (
                                      <div key={session.id} className="p-4 bg-white rounded-xl border flex justify-between items-center shadow-sm">
                                        <div>
                                          <p className="text-sm font-bold">{session.expertName}</p>
                                          <p className="text-[10px] text-slate-500 font-medium">{session.date} • {session.time}</p>
                                        </div>
                                        <Badge className={`${
                                          session.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                          session.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        } text-[10px] font-bold border-none`}>{session.status}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-10">
                                    <Clock size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-400 font-medium">No sessions scheduled.</p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-4">
                                <h4 className="font-bold text-slate-900 tracking-tight">Available {consultationType} Experts</h4>
                                <div className="space-y-3">
                                  {(consultationType === 'National' 
                                    ? [
                                        { name: "Favor Eshet", role: "Fintech Specialist, CAMA & International Expert", rating: "5.0", bio: "Developer of ReguFlow. Expert in CAMA, CBN, and global compliance architectures." },
                                        { name: "Barr. Samuel Eshet", role: "Legal Advisor & CAC Mandate", rating: "5.0", bio: "Expert in Nigerian Corporate mandates, CAC facilitation and legal advisory." }
                                      ]
                                    : [
                                        { name: "Favor Eshet", role: "International Architect & Fintech Expert", rating: "5.0", bio: "Driving intercontinental expansion for digital banks through the ReguFlow platform." },
                                        { name: "Barr. Samuel Eshet", role: "Legal Advisor (International Trade)", rating: "4.9", bio: "Specialist in AfCFTA protocols and regional market legal entry." }
                                      ]
                                  ).map((expert, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-white hover:border-emerald-200 transition-all hover:shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100 shrink-0">
                                          {expert.name?.[0]}
                                        </div>
                                        <div className="overflow-hidden">
                                          <p className="text-sm font-bold truncate">{expert.name}</p>
                                          <p className="text-[10px] text-slate-400 font-medium truncate uppercase">{expert.role}</p>
                                        </div>
                                      </div>
                                      {/* Logic check: Hide "Book" button if the expert is the admin Favor Eshet */}
                                      {isAdmin && expert.name === "Favor Eshet" ? (
                                        <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] uppercase">My Profile</Badge>
                                      ) : (
                                        <Button 
                                          variant="ghost" 
                                          className="text-emerald-600 hover:bg-emerald-50 font-bold h-8 px-3 text-[10px]"
                                          onClick={() => setSelectedExpert(expert as any)}
                                        >
                                          Book
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </main>
              </div>
            )
          } />
          <Route path="/demo" element={
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Interactive Demo</Badge>
                <h2 className="text-3xl font-bold mb-4">Experience ReguFlow Intelligence</h2>
                <p className="text-slate-600">This is a preview of our regulatory engine. Try searching for a regulation below.</p>
              </div>
              
              <Card className="border-2 border-emerald-100 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex gap-2 mb-6">
                    <Input 
                      placeholder="e.g., What are the CAC registration requirements?" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button onClick={handleSearch} disabled={isSearching} className="bg-emerald-600">
                      {isSearching ? <Loader2 className="animate-spin" /> : "Try AI Search"}
                    </Button>
                  </div>
                  {searchResult ? (
                    <div className="p-6 rounded-lg bg-slate-50 border border-slate-100 min-h-[200px]">
                      <div className="prose prose-emerald max-w-none whitespace-pre-wrap text-sm">
                        {searchResult}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed rounded-lg">
                      <Search size={48} className="mb-4 opacity-20" />
                      <p>Enter a query to see the AI in action</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-emerald-50/50 border-t border-emerald-100 p-6 flex justify-between items-center">
                  <p className="text-sm text-emerald-800 font-medium">Want full document analysis and custom roadmaps?</p>
                  <Button onClick={handleGoogleSignIn} className="bg-emerald-600">Get Full Access</Button>
                </CardFooter>
              </Card>
            </div>
          </main>
        } />
      </Routes>

      {/* CAC Registration Flow */}
      <Dialog open={showCACRegistration} onOpenChange={setShowCACRegistration}>
        <DialogContent className="sm:max-w-[700px] p-0 bg-transparent border-none shadow-none">
          <CACRegistrationForm 
            onCancel={() => setShowCACRegistration(false)}
            onComplete={handleCACComplete}
            isSubmitting={isSubmittingCAC}
          />
        </DialogContent>
      </Dialog>

      {/* Gemini Chatbot UI */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="mb-4 w-[380px] h-[550px] shadow-2xl rounded-2xl border bg-white flex flex-col overflow-hidden"
            >
              <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">
                      {consultationType === 'National' ? 'NaijaReg AI Chat' : 'ReguFlow Global AI'}
                    </h4>
                    <p className="text-[10px] opacity-80">2026 {consultationType} Regulatory Expert</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setShowChat(false)}>
                  <ChevronRight size={18} className="rotate-90" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600 leading-relaxed">
                    {consultationType === 'National' 
                      ? <span>Hello! I'm your <strong>NaijaReg AI Fixer</strong>. Ask me anything about the 2026 Nigerian regulatory landscape, from CAC filings to CBN Fintech circulars.</span>
                      : <span>Welcome to Global mode. I am your <strong>International Expansion Fixer</strong>. Ask me about intercontinental compliance, cross-border payments, or trade protocols.</span>
                    }
                  </div>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-900 rounded-tl-none'
                      }`}>
                        {msg.content}
                        {msg.role === 'model' && (
                          <FeedbackButtons id={`chat-${idx}`} context="Chat Interaction" />
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-slate-50 flex gap-2">
                <Input 
                  placeholder="Ask about compliance..." 
                  className="bg-white"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                />
                <Button size="icon" className="bg-emerald-600 shrink-0" onClick={handleChat} disabled={isChatLoading}>
                  <ArrowRight size={18} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button 
          onClick={() => setShowChat(!showChat)}
          className={`w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${
            showChat ? 'bg-slate-800 rotate-90' : 'bg-emerald-600'
          }`}
        >
          {showChat ? <Lock size={24} /> : <MessageSquare size={24} />}
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="text-emerald-600" size={24} />
                <span className="text-xl font-bold text-emerald-900">ReguFlow</span>
              </div>
              <p className="text-slate-500 max-w-sm">
                {consultationType === 'National'
                  ? 'Empowering Nigerian businesses with automated regulatory intelligence and compliance management.'
                  : 'Accelerating intercontinental expansion with AI-driven global regulatory intelligence.'}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-emerald-600">Features</a></li>
                <li><a href="#" className="hover:text-emerald-600">Pricing</a></li>
                <li><a href="#" className="hover:text-emerald-600">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-emerald-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-600">Compliance Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2026 ReguFlow. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-emerald-600">Twitter</a>
              <a href="#" className="hover:text-emerald-600">LinkedIn</a>
              <a href="#" className="hover:text-emerald-600">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
