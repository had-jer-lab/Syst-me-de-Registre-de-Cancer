import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';   // ← ajouté
import { 
  User, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  Lock,
  Mail,
  Eye,
  EyeOff,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Building2,
  Heart,
  FileText,
  Users,
  Database
} from 'lucide-react';

export default function CancerRegistryAuth() {
  const navigate = useNavigate();   // ← ajouté

  const [userType, setUserType] = useState('medecin');
  const [authMode, setAuthMode] = useState('login');
  const [currentStep, setCurrentStep] = useState(1);
  
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    numeroMedecin: '',
    specialite: '',
    etablissement: '',
    fonction: '',
    departement: '',
    niveauAcces: '',
    wilaya: '',
    commune: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptData: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const specialites = [
    'Oncologie médicale',
    'Oncologie chirurgicale',
    'Radiothérapie',
    'Hématologie',
    'Anatomie pathologique',
    'Radiologie',
    'Médecine nucléaire',
    'Chirurgie générale',
    'Gynécologie',
    'Urologie',
    'Pneumologie',
    'Gastro-entérologie',
    'Autre'
  ];
  const niveauxAcces = [
    'Administrateur Système',
    'Gestionnaire Régional',
    'Coordinateur Médical',
    'Analyste de Données'
  ];
  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
    'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
    'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
    'Constantine', 'Médéa', 'Mostaganem', 'MSila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
    'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
    'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
    'Ghardaïa', 'Relizane'
  ];

  const handleLoginInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setLoginError('');
  };

  const handleRegisterInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterData({ ...registerData, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginData.identifier || !loginData.password) {
      setLoginError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // ← useNavigate remplace window.location.href
      if (userType === 'medecin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    }, 1500);
  };

  // ── VALIDATION ─────────────────────────────────────────────────────────────
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!registerData.nom.trim()) newErrors.nom = 'Requis';
      if (!registerData.prenom.trim()) newErrors.prenom = 'Requis';
      if (!registerData.email.trim()) {
        newErrors.email = 'Requis';
      } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
        newErrors.email = 'Email invalide';
      }
      if (!registerData.telephone.trim()) {
        newErrors.telephone = 'Requis';
      } else if (!/^(0)(5|6|7)[0-9]{8}$/.test(registerData.telephone)) {
        newErrors.telephone = 'Format invalide';
      }
    }
    if (step === 2) {
      if (userType === 'medecin') {
        if (!registerData.numeroMedecin.trim()) newErrors.numeroMedecin = 'Requis';
        if (!registerData.specialite) newErrors.specialite = 'Requis';
        if (!registerData.etablissement.trim()) newErrors.etablissement = 'Requis';
      } else {
        if (!registerData.fonction.trim()) newErrors.fonction = 'Requis';
        if (!registerData.departement.trim()) newErrors.departement = 'Requis';
        if (!registerData.niveauAcces) newErrors.niveauAcces = 'Requis';
      }
      if (!registerData.wilaya) newErrors.wilaya = 'Requis';
      if (!registerData.commune.trim()) newErrors.commune = 'Requis';
    }
    if (step === 3) {
      if (!registerData.password) {
        newErrors.password = 'Requis';
      } else if (registerData.password.length < 8) {
        newErrors.password = 'Minimum 8 caractères';
      }
      if (registerData.password !== registerData.confirmPassword) {
        newErrors.confirmPassword = 'Non identique';
      }
      if (!registerData.acceptTerms) newErrors.acceptTerms = 'Requis';
      if (!registerData.acceptData) newErrors.acceptData = 'Requis';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => { if (validateStep(currentStep)) setCurrentStep(currentStep + 1); };
  const handlePreviousStep = () => { setCurrentStep(currentStep - 1); setErrors({}); };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuthMode('login');
      setCurrentStep(1);
    }, 2000);
  };

  // ── RENDER HELPERS ─────────────────────────────────────────────────────────
  const renderLoginForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {userType === 'medecin' ? 'Email / N° Médecin' : 'Identifiant Admin'}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text" name="identifier"
            value={loginData.identifier} onChange={handleLoginInputChange}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-gray-900"
            placeholder={userType === 'medecin' ? 'exemple@chu.dz' : 'Votre identifiant'}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">Mot de passe</label>
          <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Mot de passe oublié?
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'} name="password"
            value={loginData.password} onChange={handleLoginInputChange}
            className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-gray-900"
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {loginError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600 font-medium">{loginError}</p>
        </div>
      )}

      <div className="flex items-center">
        <input id="remember" type="checkbox"
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
        <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Se souvenir de moi</label>
      </div>

      <button type="submit" disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connexion...</span>
          </>
        ) : (
          <><span>Se connecter</span><ArrowRight className="w-5 h-5" /></>
        )}
      </button>
    </div>
  );

  const renderRegisterStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
          <input type="text" name="nom" value={registerData.nom} onChange={handleRegisterInputChange}
            className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.nom ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
            placeholder="Nom" />
          {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
          <input type="text" name="prenom" value={registerData.prenom} onChange={handleRegisterInputChange}
            className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.prenom ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
            placeholder="Prénom" />
          {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Email professionnel *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
          <input type="email" name="email" value={registerData.email} onChange={handleRegisterInputChange}
            className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
            placeholder="exemple@hopital.dz" />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
          <input type="tel" name="telephone" value={registerData.telephone} onChange={handleRegisterInputChange}
            className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.telephone ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
            placeholder="0555123456" />
        </div>
        {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
      </div>
    </div>
  );

  const renderRegisterStep2 = () => (
    <div className="space-y-4">
      {userType === 'medecin' ? (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">N° d'inscription à l'ordre *</label>
            <input type="text" name="numeroMedecin" value={registerData.numeroMedecin} onChange={handleRegisterInputChange}
              className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.numeroMedecin ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
              placeholder="123456789" />
            {errors.numeroMedecin && <p className="text-red-500 text-xs mt-1">{errors.numeroMedecin}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Spécialité *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Briefcase className="h-5 w-5 text-gray-400" /></div>
              <select name="specialite" value={registerData.specialite} onChange={handleRegisterInputChange}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all appearance-none ${errors.specialite ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}>
                <option value="">Sélectionnez</option>
                {specialites.map(spec => <option key={spec} value={spec}>{spec}</option>)}
              </select>
            </div>
            {errors.specialite && <p className="text-red-500 text-xs mt-1">{errors.specialite}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Établissement *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building2 className="h-5 w-5 text-gray-400" /></div>
              <input type="text" name="etablissement" value={registerData.etablissement} onChange={handleRegisterInputChange}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.etablissement ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
                placeholder="CHU Tlemcen" />
            </div>
            {errors.etablissement && <p className="text-red-500 text-xs mt-1">{errors.etablissement}</p>}
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fonction *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><ShieldCheck className="h-5 w-5 text-gray-400" /></div>
              <input type="text" name="fonction" value={registerData.fonction} onChange={handleRegisterInputChange}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.fonction ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
                placeholder="Ex: Administrateur Système" />
            </div>
            {errors.fonction && <p className="text-red-500 text-xs mt-1">{errors.fonction}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Département *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building2 className="h-5 w-5 text-gray-400" /></div>
              <input type="text" name="departement" value={registerData.departement} onChange={handleRegisterInputChange}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.departement ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
                placeholder="Registre National du Cancer" />
            </div>
            {errors.departement && <p className="text-red-500 text-xs mt-1">{errors.departement}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau d'accès *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Shield className="h-5 w-5 text-gray-400" /></div>
              <select name="niveauAcces" value={registerData.niveauAcces} onChange={handleRegisterInputChange}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all appearance-none ${errors.niveauAcces ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}>
                <option value="">Sélectionnez</option>
                {niveauxAcces.map(niveau => <option key={niveau} value={niveau}>{niveau}</option>)}
              </select>
            </div>
            {errors.niveauAcces && <p className="text-red-500 text-xs mt-1">{errors.niveauAcces}</p>}
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Wilaya *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin className="h-5 w-5 text-gray-400" /></div>
            <select name="wilaya" value={registerData.wilaya} onChange={handleRegisterInputChange}
              className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all appearance-none ${errors.wilaya ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}>
              <option value="">Sélectionnez</option>
              {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Commune *</label>
          <input type="text" name="commune" value={registerData.commune} onChange={handleRegisterInputChange}
            className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.commune ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
            placeholder="Commune" />
          {errors.commune && <p className="text-red-500 text-xs mt-1">{errors.commune}</p>}
        </div>
      </div>
    </div>
  );

  const renderRegisterStep3 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
          <input type={showPassword ? 'text' : 'password'} name="password"
            value={registerData.password} onChange={handleRegisterInputChange}
            className={`w-full pl-12 pr-12 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.password ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
            placeholder="Min. 8 caractères" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
          <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
            value={registerData.confirmPassword} onChange={handleRegisterInputChange}
            className={`w-full pl-12 pr-12 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:bg-white transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-blue-600'}`}
            placeholder="Retapez" />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
      </div>
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start">
          <input id="acceptTerms" name="acceptTerms" type="checkbox"
            checked={registerData.acceptTerms} onChange={handleRegisterInputChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-1" />
          <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-700">J'accepte les conditions d'utilisation</label>
        </div>
        {errors.acceptTerms && <p className="text-red-500 text-xs ml-7">{errors.acceptTerms}</p>}
        <div className="flex items-start">
          <input id="acceptData" name="acceptData" type="checkbox"
            checked={registerData.acceptData} onChange={handleRegisterInputChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-1" />
          <label htmlFor="acceptData" className="ml-3 text-sm text-gray-700">J'accepte la politique de confidentialité</label>
        </div>
        {errors.acceptData && <p className="text-red-500 text-xs ml-7">{errors.acceptData}</p>}
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
              currentStep >= step ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
            </div>
            <span className="text-xs mt-2 font-medium text-gray-600">
              {step === 1 ? 'Identité' : step === 2 ? 'Profil' : 'Sécurité'}
            </span>
          </div>
          {step < 3 && (
            <div className={`w-20 h-1 mx-2 rounded transition-all duration-300 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-5xl relative">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">

            {/* ── LEFT PANEL ── */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-white rounded-full"></div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Registre de Cancer</h1>
                    <p className="text-blue-200 text-sm">Système de Gestion Oncologique</p>
                  </div>
                </div>
                <div className="space-y-6 mt-16">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Gestion Complète</h3>
                      <p className="text-blue-200 text-sm leading-relaxed">Base de données centralisée des cas de cancer</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Suivi Thérapeutique</h3>
                      <p className="text-blue-200 text-sm leading-relaxed">Traçabilité complète des parcours de soins</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Collaboration Médicale</h3>
                      <p className="text-blue-200 text-sm leading-relaxed">Plateforme sécurisée pour les équipes soignantes</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-12">
                <p className="text-blue-200 text-sm">© 2026 Registre National du Cancer • Algérie</p>
              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="p-12 flex flex-col justify-center overflow-y-auto" style={{ maxHeight: '100vh' }}>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {authMode === 'login' ? 'Connexion' : 'Inscription'}
                </h2>
                <p className="text-gray-600">
                  {authMode === 'login' ? 'Accédez à votre espace professionnel' : 'Créez votre compte professionnel'}
                </p>
              </div>



              {/* Forms */}
              {authMode === 'login' ? (
                <form onSubmit={handleLogin}>{renderLoginForm()}</form>
              ) : (
                <form onSubmit={handleRegister}>
                  {renderStepIndicator()}
                  <div className="min-h-[380px]">
                    {currentStep === 1 && renderRegisterStep1()}
                    {currentStep === 2 && renderRegisterStep2()}
                    {currentStep === 3 && renderRegisterStep3()}
                  </div>
                  <div className="flex gap-4 mt-8">
                    {currentStep > 1 && (
                      <button type="button" onClick={handlePreviousStep}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-semibold hover:bg-gray-200 transition-all">
                        Précédent
                      </button>
                    )}
                    {currentStep < 3 ? (
                      <button type="button" onClick={handleNextStep}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30">
                        Suivant
                      </button>
                    ) : (
                      <button type="submit" disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg><span>Création...</span></>
                        ) : 'Créer le compte'}
                      </button>
                    )}
                  </div>
                </form>
              )}


            </div>

          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Système Sécurisé • Conforme RGPD • Données Médicales Protégées</p>
        </div>
      </div>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes blob {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(30px, -50px) scale(1.1); }
          66%  { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}



