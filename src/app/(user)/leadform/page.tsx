'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Info, CloudUpload } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LeadsUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.csv')) {
      toast.error('❌ Invalid file type. Only .xlsx or .csv files allowed.');
      e.target.value = ''; // reset input
      return;
    }

    // Validate file size
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('⚠️ File too large — max 5MB allowed.');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  // Upload file
  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    toast.loading('Uploading file...', { id: 'upload' });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Build success message with email notification stats
        let successMessage = `✅ Successfully imported ${data.imported} lead${data.imported > 1 ? 's' : ''}!`;
        
        if (data.duplicatesSkipped > 0) {
          successMessage += ` (${data.duplicatesSkipped} duplicate${data.duplicatesSkipped > 1 ? 's' : ''} skipped)`;
        }
        
        if (data.emailsSent > 0) {
          successMessage += ` 📧 ${data.emailsSent} email${data.emailsSent > 1 ? 's' : ''} sent.`;
        }
        
        if (data.emailsFailed > 0) {
          successMessage += ` ⚠️ ${data.emailsFailed} email${data.emailsFailed > 1 ? 's' : ''} failed.`;
        }
        
        // Dismiss loading toast and show success
        toast.dismiss('upload');
        toast.success(successMessage, { duration: 6000 });
        setFile(null);
        setIsUploading(false);
        // reset input so same file can be re-uploaded
        const input = document.getElementById('leadFile') as HTMLInputElement;
        if (input) input.value = '';
      } else {
        toast.dismiss('upload');
        toast.error(data.error || '❌ Upload failed. Please try again.');
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss('upload');
      toast.error('⚠️ Network or server error. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="container w-full h-screen ml-5">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-row items-center justify-between p-6 pb-4">
        <div className="h-full w-full">
          <h2 className="text-2xl font-semibold text-foreground">Leads</h2>
          <p className="text-base text-muted-foreground">Manage your leads</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-xl w-full border border-border bg-transparent py-6 shadow-sm">
        {/* Header with download */}
        <header className="grid grid-cols-[1fr_auto] items-start gap-2 px-6">
          <div>
            <h2 className="flex items-center text-lg font-semibold leading-none text-foreground">
              <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />
              Upload Your Leads File
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload your <code>.xlsx</code> or <code>.csv</code> file containing leads data. Ensure your columns and enums follow the format below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.open('/api/download/sample-csv', '_blank');
            }}
            className="h-9 rounded-md bg-white text-black px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
          >
            Download Sample
          </button>
        </header>

        <hr className="h-px w-full bg-border" />

        {/* Content grid */}
        <div className="grid grid-cols-1 gap-6 px-6 md:grid-cols-2">
          {/* Left: instructions */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Excel Upload Requirements</h3>
            <div>
              <h4 className="text-sm font-medium">Required Columns</h4>
              <ul className="list-inside list-disc space-y-1 text-gray-400 text-sm text-muted-foreground">
                <li><code>name</code> – Full name of the lead (required)</li>
                <li><code>email</code> – Valid email address (optional)</li>
                <li><code>phone</code> – Phone number (optional)</li>
                <li><code>company</code> – Company or organization (optional)</li>
                <li><code>notes</code> – Any additional remarks (optional)</li>
                <li><code>source</code> – Lead source (optional)</li>
                <li><code>tag</code> – Lead tag/status (optional)</li>
                <li><code>duration</code> – Positive integer in days (optional)</li>
                <li><code>amount</code> – Deal amount/value (optional)</li>
                <li><code>Leads created date</code> – Date lead was created (optional)</li>
                <li><code>Leads updated dates</code> – Date lead was updated (optional)</li>
                <li><code>Enquiry date</code> – Date of enquiry (optional)</li>
                <li><code>Booking date</code> – Date of booking (optional)</li>
                <li><code>Check in dates</code> – Check-in date (optional)</li>
              </ul>
              <p className="text-xs text-muted-foreground text-gray-400">Column headers are <strong>case-sensitive</strong>. Date format: YYYY-MM-DD</p>
            </div>

            <hr className="h-px bg-border" />

            <div>
              <h4 className="text-sm font-medium">Accepted Source Values</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {['SOCIAL', 'REFERRAL', 'EVENT', 'MARKETING', 'OTHER'].map((src) => (
                  <span key={src} className="rounded-md bg-secondary px-2 py-0.5 text-sm font-semibold text-secondary-foreground">{src}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Use these exact uppercase keys (or lowercase equivalents).</p>
            </div>

            <hr className="h-px bg-border" />

            <div>
              <h4 className="text-sm font-medium">Accepted Tag Values</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {['HOT', 'WARM', 'COLD', 'QUALIFIED', 'DISQUALIFIED'].map((tag) => (
                  <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-sm font-semibold text-secondary-foreground">{tag}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Invalid or missing tags default to <code>DISQUALIFIED</code>.</p>
            </div>

            <hr className="h-px bg-border" />

            <div>
              <h4 className="text-sm font-medium">Accepted Status Values</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {['REQUESTED', 'RUNNING', 'COMPLETE', 'CREATED', 'REJECTED'].map((status) => (
                  <span key={status} className="rounded-md border bg-card px-2 py-0.5 text-sm font-semibold text-foreground">{status}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground"><code>status</code> is optional but must match one of these values.</p>
            </div>
          </div>

          {/* Right: upload */}
          <div className="space-y-3">
            <label htmlFor="leadFile" className="flex items-center gap-2 text-sm font-medium leading-none">
              <CloudUpload className="h-4 w-4" />
              Excel or CSV File (.xlsx, .csv)
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </label>

            <div className="flex flex-col gap-4">
              <label
                htmlFor="leadFile"
                role="button"
                className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-input p-4 text-center transition hover:bg-muted/50 cursor-pointer"
              >
                <input
                  id="leadFile"
                  type="file"
                  accept=".xlsx,.csv"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <div className="mb-2 flex size-11 items-center justify-center rounded-full border bg-background">
                  {isUploading ? (
                    <span className="text-xs text-muted-foreground">⏳</span>
                  ) : (
                    <Upload className="size-4 opacity-60" />
                  )}
                </div>
                <p className="mb-1.5 text-sm font-medium">
                  {isUploading ? 'Uploading...' : file ? file.name : 'Upload file'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to browse (max. 5MB)
                </p>
              </label>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full bg-[#cbc6c6] rounded-md px-4 py-2 text-sm font-medium text-black transition hover:bg-[#b3b0b0] disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>

            <p className="text-sm text-muted-foreground">
              Accepts <code>.xlsx</code> or <code>.csv</code> files. Max 5MB. Max 100 leads per upload.
            </p>

            <hr className="h-px bg-border" />

            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              ✅ Tip: Always verify your Excel headers match exactly. It’ll save you from a soul-crushing “why isn’t this uploading?” moment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
