import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  User, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  ExternalLink,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CACRegistrationFormProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CAC_STEPS = [
  { id: 'name-search', title: 'Name Reservation', icon: SearchIcon },
  { id: 'directors', title: 'Directors & Shareholders', icon: UserIcon },
  { id: 'documents', title: 'Document Upload', icon: FileIcon },
  { id: 'submission', title: 'Final Submission', icon: CheckIcon }
];

function SearchIcon(props: any) { return <Building2 {...props} />; }
function UserIcon(props: any) { return <User {...props} />; }
function FileIcon(props: any) { return <FileText {...props} />; }
function CheckIcon(props: any) { return <CheckCircle2 {...props} />; }

export const CACRegistrationForm: React.FC<CACRegistrationFormProps> = ({ onComplete, onCancel, isSubmitting }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    proposedName1: '',
    proposedName2: '',
    businessType: 'Private Limited Company',
    directors: [{ name: '', email: '', idType: 'NIN' }],
    shareholders: [{ name: '', shares: '' }],
    objectives: '',
    address: '',
    documents: {
      nin: false,
      signature: false,
      utility: false
    }
  });

  const progress = ((currentStep + 1) / CAC_STEPS.length) * 100;

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, CAC_STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
              <Info className="shrink-0" size={18} />
              <div>
                <p className="font-semibold mb-1">Step 1: Public Search</p>
                <p>Before proceeding, check if your preferred names are available on the CAC Public Search portal.</p>
                <a 
                  href="https://search.cac.gov.ng/home" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold underline mt-2"
                >
                  Visit CAC Search Portal <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name1">Primary Proposed Name</Label>
                <Input 
                  id="name1"
                  placeholder="e.g. Acme Fintech Nigeria LTD"
                  value={formData.proposedName1}
                  onChange={(e) => handleInputChange('proposedName1', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name2">Alternative Proposed Name</Label>
                <Input 
                  id="name2"
                  placeholder="e.g. Acme Solutions Nigeria LTD"
                  value={formData.proposedName2}
                  onChange={(e) => handleInputChange('proposedName2', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Business Structure</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                >
                  <option>Private Limited Company (LTD)</option>
                  <option>Public Limited Company (PLC)</option>
                  <option>Limited by Guarantee (LTD/GTE)</option>
                  <option>Unlimited Company (ULTD)</option>
                </select>
              </div>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">Directors</h4>
                <Button variant="outline" size="sm" onClick={() => {
                  const newDirectors = [...formData.directors, { name: '', email: '', idType: 'NIN' }];
                  handleInputChange('directors', newDirectors);
                }}>Add Director</Button>
              </div>
              {formData.directors.map((director, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 bg-slate-50/50">
                  <div className="grid gap-2">
                    <Label>Full Name (as per NIN)</Label>
                    <Input 
                      value={director.name}
                      onChange={(e) => {
                        const newDirs = [...formData.directors];
                        newDirs[index].name = e.target.value;
                        handleInputChange('directors', newDirs);
                      }}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input 
                        type="email"
                        value={director.email}
                        onChange={(e) => {
                          const newDirs = [...formData.directors];
                          newDirs[index].email = e.target.value;
                          handleInputChange('directors', newDirs);
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>ID Type</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={director.idType}
                        onChange={(e) => {
                          const newDirs = [...formData.directors];
                          newDirs[index].idType = e.target.value;
                          handleInputChange('directors', newDirs);
                        }}
                      >
                        <option>NIN</option>
                        <option>International Passport</option>
                        <option>Driver's License</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
             <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3 text-sm text-amber-800">
              <AlertTriangle className="shrink-0" size={18} />
              <div>
                <p className="font-semibold mb-1">Document Readiness</p>
                <p>CAC requires clear, scanned copies of government-issued IDs for all directors. Max file size: 2MB per document.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Director IDs (NIN/Passport)</p>
                    <p className="text-xs text-slate-500">Required for all listed directors</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-2">
                  <Upload size={14} /> Upload
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Signature Specimens</p>
                    <p className="text-xs text-slate-500">White background signature scan</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-2">
                  <Upload size={14} /> Upload
                </Button>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-bold">Registration Summary</h3>
              <p className="text-slate-500">Review your details before syncing to your profile.</p>
            </div>

            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Proposed Name:</span>
                <span className="font-bold">{formData.proposedName1}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Type:</span>
                <span className="font-medium">{formData.businessType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Directors Count:</span>
                <span className="font-medium">{formData.directors.length}</span>
              </div>
            </div>

            <div className="p-4 border border-emerald-100 bg-emerald-50 rounded-lg">
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Once confirmed, ReguFlow will generate your pre-filled incorporation forms (CAC 1.1) and provide the direct payment link for name reservation fees (₦500).
              </p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-2xl border-emerald-100 bg-white/95 backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px] tracking-widest font-bold">
            CAC Compliance 2026
          </Badge>
          <span className="text-xs font-medium text-slate-400">Step {currentStep + 1} of {CAC_STEPS.length}</span>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-slate-900">{CAC_STEPS[currentStep].title}</CardTitle>
          <CardDescription>Follow the official CAC protocol for company incorporation.</CardDescription>
        </div>
        <div className="pt-2">
          <Progress value={progress} className="h-1.5" />
        </div>
        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg gap-2 overflow-x-auto no-scrollbar">
          {CAC_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.id} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md min-w-fit transition-all duration-300 ${
                  index <= currentStep ? 'bg-white shadow-sm ring-1 ring-emerald-100' : 'opacity-40 grayscale'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${index < currentStep ? 'bg-emerald-500 text-white' : index === currentStep ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {index < currentStep ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </div>
                <span className={`text-[11px] font-bold ${index === currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="min-h-[400px]">
        {renderStep()}
      </CardContent>

      <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
        <Button 
          variant="outline" 
          onClick={currentStep === 0 ? onCancel : prevStep}
          className="gap-2"
        >
          {currentStep === 0 ? "Cancel" : <><ChevronLeft size={16} /> Previous</>}
        </Button>
        <Button 
          onClick={currentStep === CAC_STEPS.length - 1 ? () => onComplete(formData) : nextStep}
          className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px] gap-2"
          disabled={isSubmitting}
        >
          {currentStep === CAC_STEPS.length - 1 ? (
            isSubmitting ? "Syncing..." : "Finalize & Save"
          ) : (
            <>Next Step <ChevronRight size={16} /></>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
