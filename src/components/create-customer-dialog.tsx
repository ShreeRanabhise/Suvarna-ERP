'use client'

import { useState, useRef } from 'react'
import { createCustomer } from '@/app/actions'
import { validateVerhoeff } from '@/lib/validation'
import { 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  RefreshCw, 
  Trash2, 
  Camera, 
  ShieldCheck, 
  CreditCard,
  MapPin,
  Phone,
  Eye
} from 'lucide-react'

interface UploadedFileState {
  file: File | null
  previewUrl: string | null
  filePath: string | null
  uploading: boolean
  error: string | null
}

function UploadCard({
  label,
  required,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  maxSizeMB = 5,
  isCircular = false,
  fileState,
  onChange,
  onRemove,
}: {
  label: string
  required?: boolean
  accept?: string
  maxSizeMB?: number
  isCircular?: boolean
  fileState: UploadedFileState
  onChange: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  function handleFileSelected(selectedFile: File | null) {
    if (!selectedFile) return
    
    // Validate size (5MB)
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds maximum allowed size of ${maxSizeMB}MB.`)
      return
    }

    onChange(selectedFile)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const displayUrl = fileState.previewUrl || (fileState.filePath ? (fileState.filePath.startsWith('/') || fileState.filePath.startsWith('http') ? fileState.filePath : `/api/kyc/view?path=${encodeURIComponent(fileState.filePath)}`) : null)

  if (isCircular) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </label>
        
        <div className="flex items-center gap-4">
          <div 
            onClick={() => {
              if (displayUrl) {
                setIsPreviewOpen(true)
              } else {
                inputRef.current?.click()
              }
            }}
            className={`relative h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all group ${
              displayUrl 
                ? 'border-primary bg-background' 
                : 'border-border hover:border-primary/50 bg-background-secondary/50'
            }`}
          >
            {displayUrl ? (
              <img 
                src={displayUrl} 
                alt="Customer Avatar" 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-foreground-muted group-hover:text-primary transition-colors">
                <Camera className="h-6 w-6" />
                <span className="text-[10px] mt-0.5 font-medium">Upload</span>
              </div>
            )}

            {fileState.uploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          <input 
            ref={inputRef} 
            type="file" 
            accept={accept} 
            className="hidden" 
            onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
          />

          <div className="flex flex-col gap-1.5 text-xs text-foreground-secondary">
            <p className="font-medium text-foreground">Customer Profile Photo</p>
            <p className="text-foreground-muted text-[11px]">JPG, PNG or WEBP up to 5MB</p>
            {displayUrl && (
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex items-center gap-1 text-destructive hover:underline text-xs font-medium"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Lightbox for Circular Avatar */}
        {isPreviewOpen && displayUrl && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 backdrop-blur-md animate-fade-in p-4"
            onClick={() => setIsPreviewOpen(false)}
          >
            <div className="relative bg-card rounded-modal border border-border shadow-modal max-w-lg w-full p-4 text-center my-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
                <h4 className="text-sm font-semibold text-foreground">{label} Preview</h4>
                <button onClick={() => setIsPreviewOpen(false)} className="text-foreground-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img src={displayUrl} alt={label} className="max-h-[60vh] mx-auto rounded-full border border-border shadow-subtle object-cover" />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-destructive">*</span>}
      </label>

      <input 
        ref={inputRef} 
        type="file" 
        accept={accept} 
        className="hidden" 
        onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
      />

      {displayUrl ? (
        <div className="relative rounded-lg border border-border bg-card p-3 flex items-center gap-3 shadow-subtle">
          <img 
            src={displayUrl} 
            alt={label} 
            onClick={() => setIsPreviewOpen(true)}
            className={`${label.toLowerCase().includes('photo') ? 'h-16 w-12 aspect-[3/4]' : 'h-14 w-20'} object-cover rounded-md border border-border bg-background cursor-pointer hover:opacity-80 transition-opacity`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {fileState.file?.name || 'Document Uploaded'}
            </p>
            <p className="text-[10px] text-foreground-muted mt-0.5">
              {fileState.file ? `${(fileState.file.size / 1024).toFixed(0)} KB` : 'Uploaded'}
            </p>
            {fileState.uploading && (
              <span className="text-[10px] text-primary font-medium flex items-center gap-1 mt-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> Uploading...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              aria-label="Preview document"
              className="p-1.5 text-primary hover:bg-primary-light/50 rounded-md transition-colors"
              title="Preview document"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Replace document"
              className="p-1.5 text-foreground-secondary hover:text-foreground hover:bg-background-secondary rounded-md transition-colors"
              title="Replace file"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Delete document"
              className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-primary bg-primary-light/20' 
              : fileState.error 
              ? 'border-destructive bg-destructive/5' 
              : 'border-border hover:border-primary/50 bg-background-secondary/40'
          }`}
        >
          <div className="p-2 bg-background rounded-full border border-border shadow-subtle mb-1 text-primary">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            Click to upload or drag & drop
          </p>
          <p className="text-[10px] text-foreground-muted mt-0.5">
            JPG, PNG, WEBP (Max 5MB)
          </p>
          {fileState.error && (
            <p className="text-[11px] text-destructive font-medium mt-1">
              {fileState.error}
            </p>
          )}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {isPreviewOpen && displayUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 backdrop-blur-md animate-fade-in p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative bg-card rounded-modal border border-border shadow-modal max-w-3xl w-full p-4 flex flex-col my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
              <h4 className="text-sm font-semibold text-foreground">{label} Preview</h4>
              <button onClick={() => setIsPreviewOpen(false)} className="text-foreground-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-background p-2 rounded-md border border-border min-h-[300px]">
              <img src={displayUrl} alt={label} className="max-h-[65vh] w-auto max-w-full object-contain rounded-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const INDIAN_STATES_CITIES: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Chhatrapati Sambhajinagar", "Solapur", "Amravati", "Kolhapur", "Sangli", "Nanded", "Jalgaon", "Akola", "Latur", "Dhule", "Other"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari", "Other"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Davangere", "Ballari", "Vijayapura", "Shivamogga", "Other"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore", "Tirunelveli", "Other"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Other"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Rajahmundry", "Tirupati", "Other"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Other"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Other"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Noida", "Ghaziabad", "Prayagraj", "Bareilly", "Aligarh", "Other"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Kharagpur", "Other"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Other"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Karnal", "Other"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Other"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Other"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Other"],
  "Other State": ["Other City"]
}

export default function CreateCustomerDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Form Field States
  const [fullName, setFullName] = useState('')
  const [fullNameTouched, setFullNameTouched] = useState(false)

  const [phone, setPhone] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)

  const [aadhaarRaw, setAadhaarRaw] = useState('')
  const [aadhaarFormatted, setAadhaarFormatted] = useState('')
  const [aadhaarTouched, setAadhaarTouched] = useState(false)

  const [pan, setPan] = useState('')
  const [panTouched, setPanTouched] = useState(false)

  // Structured Address States
  const [streetAddress, setStreetAddress] = useState('')
  const [streetAddressTouched, setStreetAddressTouched] = useState(false)
  
  const [selectedState, setSelectedState] = useState('Maharashtra')
  const [selectedCity, setSelectedCity] = useState('Mumbai')
  
  const [pincode, setPincode] = useState('')
  const [pincodeTouched, setPincodeTouched] = useState(false)
  const country = 'India'

  // Document Upload States
  const [aadhaarFront, setAadhaarFront] = useState<UploadedFileState>({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })
  const [aadhaarBack, setAadhaarBack] = useState<UploadedFileState>({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })
  const [panPhoto, setPanPhoto] = useState<UploadedFileState>({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })
  const [customerPhoto, setCustomerPhoto] = useState<UploadedFileState>({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })

  // Formatting & Validation Rules
  const cleanFullName = fullName.replace(/\s+/g, ' ').trim()
  const isFullNameValid = cleanFullName.length >= 3 && cleanFullName.length <= 100 && /^[a-zA-Z\s.]+$/.test(cleanFullName)
  const fullNameError = !fullName 
    ? "Enter customer's full name." 
    : cleanFullName.length < 3 
    ? "Name must contain at least 3 characters." 
    : !/^[a-zA-Z\s.]+$/.test(cleanFullName) 
    ? "Only alphabets, spaces, and periods allowed." 
    : ""

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone)
  const phoneError = !phone 
    ? "Enter a valid mobile number." 
    : phone.length !== 10 
    ? "Mobile number must be exactly 10 digits." 
    : !/^[6-9]/.test(phone) 
    ? "Enter a valid Indian mobile number starting with 6-9." 
    : ""

  const isAadhaarValid = aadhaarRaw.length === 12 && !/^(\d)\1{11}$/.test(aadhaarRaw) && validateVerhoeff(aadhaarRaw)
  const aadhaarError = !aadhaarRaw 
    ? "Enter a valid Aadhaar number." 
    : aadhaarRaw.length !== 12 
    ? "Aadhaar must be exactly 12 digits." 
    : /^(\d)\1{11}$/.test(aadhaarRaw) || !validateVerhoeff(aadhaarRaw) 
    ? "Invalid Aadhaar checksum." 
    : ""

  const isPanValid = !pan || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
  const panError = pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan) ? "Enter a valid PAN number." : ""

  const cleanStreetAddress = streetAddress.trim()
  const isStreetAddressValid = cleanStreetAddress.length >= 5 && cleanStreetAddress.length <= 300
  const streetAddressError = !cleanStreetAddress 
    ? "Street address is required." 
    : cleanStreetAddress.length < 5 
    ? "Address must contain at least 5 characters." 
    : ""

  const isPincodeValid = /^[1-9][0-9]{5}$/.test(pincode)
  const pincodeError = !pincode 
    ? "Pincode is required." 
    : pincode.length !== 6 
    ? "Pincode must be exactly 6 digits." 
    : !/^[1-9]/.test(pincode) 
    ? "Enter a valid 6-digit Indian pincode." 
    : ""

  // Format Name on blur (Title Case)
  function handleFullNameBlur() {
    setFullNameTouched(true)
    if (!fullName) return
    const formatted = fullName
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '')
      .join(' ')
    setFullName(formatted)
  }

  // Format Aadhaar on input: 1234 5678 9012
  function handleAadhaarInput(val: string) {
    const raw = val.replace(/\D/g, '').slice(0, 12)
    setAadhaarRaw(raw)
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim()
    setAadhaarFormatted(formatted)
  }

  // File Upload Processing Helper
  async function uploadFileDirect(file: File): Promise<string> {
    const uploadData = new FormData()
    uploadData.append('file', file)

    const res = await fetch('/api/kyc/upload', {
      method: 'POST',
      body: uploadData
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Failed to upload document image')
    }

    const { filePath } = await res.json()
    return filePath
  }

  function handleFileChange(
    file: File, 
    setState: React.Dispatch<React.SetStateAction<UploadedFileState>>
  ) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64Url = e.target?.result as string || ''
      setState({ file, previewUrl: base64Url, filePath: null, uploading: true, error: null })

      try {
        const filePath = await uploadFileDirect(file)
        setState({ file, previewUrl: base64Url, filePath, uploading: false, error: null })
      } catch {
        // Keep Base64 Data URI active so user can preview document regardless of network state
        setState({ 
          file, 
          previewUrl: base64Url, 
          filePath: null, 
          uploading: false, 
          error: null 
        })
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    // Touch all fields to trigger live error states
    setFullNameTouched(true)
    setPhoneTouched(true)
    setAadhaarTouched(true)
    setPanTouched(true)
    setStreetAddressTouched(true)
    setPincodeTouched(true)

    if (!isFullNameValid) { setError(fullNameError); return }
    if (!isPhoneValid) { setError(phoneError); return }
    if (!isAadhaarValid) { setError(aadhaarError); return }
    if (!isPanValid) { setError(panError); return }
    if (!isStreetAddressValid) { setError(streetAddressError); return }
    if (!isPincodeValid) { setError(pincodeError); return }

    // Validate mandatory Aadhaar uploads
    if (!aadhaarFront.file && !aadhaarFront.filePath) {
      setError('Upload Aadhaar Front image.')
      return
    }

    if (!aadhaarBack.file && !aadhaarBack.filePath) {
      setError('Upload Aadhaar Back image.')
      return
    }

    // Validate conditional PAN photo requirement
    if (pan && !panPhoto.file && !panPhoto.filePath) {
      setError('PAN photo is required because PAN number is provided.')
      return
    }

    setLoading(true)

    try {
      // Ensure all uploads finish
      let frontPath = aadhaarFront.filePath
      if (aadhaarFront.file && !frontPath) {
        frontPath = await uploadFileDirect(aadhaarFront.file)
      }

      let backPath = aadhaarBack.filePath
      if (aadhaarBack.file && !backPath) {
        backPath = await uploadFileDirect(aadhaarBack.file)
      }

      let customerPath = customerPhoto.filePath
      if (customerPhoto.file && !customerPath) {
        customerPath = await uploadFileDirect(customerPhoto.file)
      }

      let panPath = panPhoto.filePath
      if (panPhoto.file && !panPath) {
        panPath = await uploadFileDirect(panPhoto.file)
      }

      const fullAddress = `${cleanStreetAddress}, ${selectedCity}, ${selectedState} - ${pincode}, ${country}`

      const submitData = new FormData()
      submitData.set('fullName', cleanFullName)
      submitData.set('phone', phone)
      submitData.set('aadhaar', aadhaarRaw)
      if (pan) submitData.set('pan', pan)
      submitData.set('address', fullAddress)

      if (frontPath) submitData.set('aadhaarFrontUrl', frontPath)
      if (backPath) submitData.set('aadhaarBackUrl', backPath)
      if (customerPath) submitData.set('customerPhotoUrl', customerPath)
      if (panPath) submitData.set('panPhotoUrl', panPath)

      const res = await createCustomer(submitData)
      if (!res.success) {
        setError(res.error)
        return
      }

      // Reset state & Close
      setIsOpen(false)
      resetForm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save customer details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFullName('')
    setFullNameTouched(false)
    setPhone('')
    setPhoneTouched(false)
    setAadhaarRaw('')
    setAadhaarFormatted('')
    setAadhaarTouched(false)
    setPan('')
    setPanTouched(false)
    setStreetAddress('')
    setStreetAddressTouched(false)
    setSelectedState('Maharashtra')
    setSelectedCity('Mumbai')
    setPincode('')
    setPincodeTouched(false)
    setAadhaarFront({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })
    setAadhaarBack({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })
    setPanPhoto({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })
    setCustomerPhoto({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setError(null) }}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
      >
        <User className="h-4 w-4" />
        <span>Add Customer</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in p-4 overflow-y-auto"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false) }}
        >
          <div 
            role="dialog"
            aria-labelledby="add-customer-modal-title"
            aria-modal="true"
            className="bg-card p-6 md:p-8 rounded-modal border border-border shadow-modal max-w-3xl w-full max-h-[92vh] overflow-y-auto relative my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-primary-light text-primary flex items-center justify-center font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="add-customer-modal-title" className="text-lg font-sans font-semibold text-foreground">
                    New Customer Registration
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    Complete customer profile and identity verification details
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                aria-label="Close dialog"
                className="text-foreground-muted hover:text-foreground p-1.5 rounded-md hover:bg-background-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* SECTION 1: CUSTOMER INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <User className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                    Customer Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fullName" className="text-sm font-medium text-foreground flex items-center justify-between">
                      <span>Full Name *</span>
                      {fullNameTouched && isFullNameValid && (
                        <span className="text-success text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        id="fullName"
                        name="fullName"
                        required
                        autoFocus
                        value={fullName}
                        placeholder="e.g. Ramesh S Patil"
                        onInput={(e) => {
                          const val = e.currentTarget.value
                            .replace(/[^a-zA-Z\s.]/g, '')
                            .replace(/\s{2,}/g, ' ')
                            .replace(/^\s+/, '')
                          setFullName(val)
                          setFullNameTouched(true)
                        }}
                        onBlur={handleFullNameBlur}
                        className={`w-full rounded-md px-3 py-2 border text-sm text-foreground bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                          fullNameTouched 
                            ? isFullNameValid 
                              ? 'border-success focus-visible:ring-success' 
                              : 'border-destructive focus-visible:ring-destructive' 
                            : 'border-border focus-visible:ring-primary'
                        }`}
                      />
                      {fullNameTouched && !isFullNameValid && (
                        <AlertCircle className="h-4 w-4 text-destructive absolute right-3 top-2.5 pointer-events-none" />
                      )}
                    </div>
                    {fullNameTouched && !isFullNameValid && (
                      <span className="text-xs text-destructive font-medium mt-0.5">{fullNameError}</span>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground flex items-center justify-between">
                      <span>Mobile Number *</span>
                      {phoneTouched && isPhoneValid && (
                        <span className="text-success text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        id="phone"
                        name="phone"
                        required
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        placeholder="10-digit Indian mobile number"
                        onInput={(e) => {
                          const val = e.currentTarget.value.replace(/\D/g, '').slice(0, 10)
                          setPhone(val)
                          setPhoneTouched(true)
                        }}
                        className={`w-full rounded-md px-3 py-2 border text-sm text-foreground font-mono bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                          phoneTouched 
                            ? isPhoneValid 
                              ? 'border-success focus-visible:ring-success' 
                              : 'border-destructive focus-visible:ring-destructive' 
                            : 'border-border focus-visible:ring-primary'
                        }`}
                      />
                      {phoneTouched && !isPhoneValid && (
                        <AlertCircle className="h-4 w-4 text-destructive absolute right-3 top-2.5 pointer-events-none" />
                      )}
                    </div>
                    {phoneTouched && !isPhoneValid && (
                      <span className="text-xs text-destructive font-medium mt-0.5">{phoneError}</span>
                    )}
                  </div>
                </div>

                {/* Street Address */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="streetAddress" className="text-sm font-medium text-foreground flex items-center justify-between">
                    <span>Street Address / Area *</span>
                    {streetAddressTouched && isStreetAddressValid && (
                      <span className="text-success text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      id="streetAddress"
                      name="streetAddress"
                      required
                      rows={2}
                      minLength={5}
                      maxLength={300}
                      value={streetAddress}
                      placeholder="House/Flat #, Building, Street, Area"
                      onInput={(e) => {
                        setStreetAddress(e.currentTarget.value)
                        setStreetAddressTouched(true)
                      }}
                      className={`w-full rounded-md px-3 py-2 border text-sm text-foreground bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                        streetAddressTouched 
                          ? isStreetAddressValid 
                            ? 'border-success focus-visible:ring-success' 
                            : 'border-destructive focus-visible:ring-destructive' 
                          : 'border-border focus-visible:ring-primary'
                      }`}
                    />
                    {streetAddressTouched && !isStreetAddressValid && (
                      <AlertCircle className="h-4 w-4 text-destructive absolute right-3 top-2.5 pointer-events-none" />
                    )}
                  </div>
                  {streetAddressTouched && !isStreetAddressValid && (
                    <span className="text-xs text-destructive font-medium mt-0.5">{streetAddressError}</span>
                  )}
                </div>

                {/* State & City Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* State Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="stateSelect" className="text-sm font-medium text-foreground">State *</label>
                    <select
                      id="stateSelect"
                      value={selectedState}
                      onChange={(e) => {
                        const newState = e.target.value
                        setSelectedState(newState)
                        const cities = INDIAN_STATES_CITIES[newState] || ["Other"]
                        setSelectedCity(cities[0])
                      }}
                      className="w-full rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {Object.keys(INDIAN_STATES_CITIES).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* City Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="citySelect" className="text-sm font-medium text-foreground">City *</label>
                    <select
                      id="citySelect"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {(INDIAN_STATES_CITIES[selectedState] || ["Other"]).map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pincode & Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pincode Input */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pincode" className="text-sm font-medium text-foreground flex items-center justify-between">
                      <span>Pincode *</span>
                      {pincodeTouched && isPincodeValid && (
                        <span className="text-success text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        id="pincode"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        placeholder="6-digit Pincode (e.g. 400001)"
                        onInput={(e) => {
                          const val = e.currentTarget.value.replace(/\D/g, '').slice(0, 6)
                          setPincode(val)
                          setPincodeTouched(true)
                        }}
                        className={`w-full rounded-md px-3 py-2 border text-sm text-foreground font-mono bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                          pincodeTouched 
                            ? isPincodeValid 
                              ? 'border-success focus-visible:ring-success' 
                              : 'border-destructive focus-visible:ring-destructive' 
                            : 'border-border focus-visible:ring-primary'
                        }`}
                      />
                      {pincodeTouched && !isPincodeValid && (
                        <AlertCircle className="h-4 w-4 text-destructive absolute right-3 top-2.5 pointer-events-none" />
                      )}
                    </div>
                    {pincodeTouched && !isPincodeValid && (
                      <span className="text-xs text-destructive font-medium mt-0.5">{pincodeError}</span>
                    )}
                  </div>

                  {/* Country Field (Pre-filled & Locked to India) */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="country" className="text-sm font-medium text-foreground">Country</label>
                    <input
                      id="country"
                      readOnly
                      value="India"
                      className="w-full rounded-md px-3 py-2 border border-border bg-background-secondary/70 text-sm text-foreground-secondary font-medium cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: IDENTITY DOCUMENTS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                    Identity Documents
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aadhaar Number */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="aadhaar" className="text-sm font-medium text-foreground flex items-center justify-between">
                      <span>Aadhaar Number *</span>
                      {aadhaarTouched && isAadhaarValid && (
                        <span className="text-success text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valid Checksum
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        id="aadhaar"
                        name="aadhaar"
                        required
                        maxLength={14}
                        value={aadhaarFormatted}
                        placeholder="1234 5678 9012"
                        onInput={(e) => {
                          handleAadhaarInput(e.currentTarget.value)
                          setAadhaarTouched(true)
                        }}
                        className={`w-full rounded-md px-3 py-2 border text-sm text-foreground font-mono bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                          aadhaarTouched 
                            ? isAadhaarValid 
                              ? 'border-success focus-visible:ring-success' 
                              : 'border-destructive focus-visible:ring-destructive' 
                            : 'border-border focus-visible:ring-primary'
                        }`}
                      />
                      {aadhaarTouched && !isAadhaarValid && (
                        <AlertCircle className="h-4 w-4 text-destructive absolute right-3 top-2.5 pointer-events-none" />
                      )}
                    </div>
                    {aadhaarTouched && !isAadhaarValid && (
                      <span className="text-xs text-destructive font-medium mt-0.5">{aadhaarError}</span>
                    )}
                  </div>

                  {/* PAN Number */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pan" className="text-sm font-medium text-foreground flex items-center justify-between">
                      <span>PAN Number (Optional)</span>
                      {panTouched && isPanValid && pan && (
                        <span className="text-success text-xs flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valid PAN
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        id="pan"
                        name="pan"
                        maxLength={10}
                        value={pan}
                        placeholder="ABCDE1234F"
                        onInput={(e) => {
                          const val = e.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                          setPan(val)
                          setPanTouched(true)
                        }}
                        className={`w-full rounded-md px-3 py-2 border text-sm text-foreground font-mono uppercase bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                          panTouched && pan 
                            ? isPanValid 
                              ? 'border-success focus-visible:ring-success' 
                              : 'border-destructive focus-visible:ring-destructive' 
                            : 'border-border focus-visible:ring-primary'
                        }`}
                      />
                      {panTouched && pan && !isPanValid && (
                        <AlertCircle className="h-4 w-4 text-destructive absolute right-3 top-2.5 pointer-events-none" />
                      )}
                    </div>
                    {panTouched && pan && !isPanValid && (
                      <span className="text-xs text-destructive font-medium mt-0.5">{panError}</span>
                    )}
                  </div>
                </div>

                {/* Aadhaar Uploads (Front & Back Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UploadCard
                    label="Aadhaar Front"
                    required
                    fileState={aadhaarFront}
                    onChange={(file) => handleFileChange(file, setAadhaarFront)}
                    onRemove={() => setAadhaarFront({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })}
                  />

                  <UploadCard
                    label="Aadhaar Back"
                    required
                    fileState={aadhaarBack}
                    onChange={(file) => handleFileChange(file, setAadhaarBack)}
                    onRemove={() => setAadhaarBack({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })}
                  />
                </div>

                {/* PAN Photo (Conditional Requirement) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UploadCard
                    label={`PAN Photo ${pan ? '*' : '(Optional)'}`}
                    required={!!pan}
                    fileState={panPhoto}
                    onChange={(file) => handleFileChange(file, setPanPhoto)}
                    onRemove={() => setPanPhoto({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })}
                  />
                </div>
              </div>

              {/* SECTION 3: CUSTOMER PROFILE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                    Customer Profile
                  </h4>
                </div>

                <UploadCard
                  label="Customer Photo (Optional)"
                  fileState={customerPhoto}
                  onChange={(file) => handleFileChange(file, setCustomerPhoto)}
                  onRemove={() => setCustomerPhoto({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })}
                />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Footer Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 h-10 border border-border hover:bg-background-secondary rounded-md text-sm font-medium text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 h-10 bg-primary text-primary-foreground hover:bg-primary-hover rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Saving Customer...</span>
                    </>
                  ) : (
                    <span>Save Customer</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}
