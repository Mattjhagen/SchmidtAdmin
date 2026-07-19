'use client';

import { useRef, useState } from 'react';
import { uploadMarketingImage } from '@/app/actions/uploadImage';

interface Props {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
}

export default function ImageUploader({ currentUrl, onUploaded, label = 'Photo' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState(currentUrl ?? '');
  const [urlInput, setUrlInput] = useState('');
  const [tab, setTab] = useState<'upload' | 'url'>('upload');

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append('file', file);
    const result = await uploadMarketingImage(fd);
    setUploading(false);
    if ('error' in result) {
      // If Supabase not configured, switch to URL tab automatically
      if (result.error.toLowerCase().includes('not configured')) {
        setTab('url');
        setUploadError('Photo upload requires Supabase Storage. Paste an image URL below instead.');
      } else {
        setUploadError(result.error);
      }
    } else {
      setPreview(result.url);
      onUploaded(result.url);
    }
  }

  function applyUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setPreview(url);
    onUploaded(url);
    setUrlInput('');
  }

  function clear() {
    setPreview('');
    onUploaded('');
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

      {/* Tab switcher */}
      <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex-1 py-1.5 transition-colors ${tab === 'upload' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex-1 py-1.5 transition-colors ${tab === 'url' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
        >
          Paste URL
        </button>
      </div>

      {tab === 'upload' && (
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-yellow-400 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <p className="text-2xl">📷</p>
          <p className="text-xs text-slate-400">Click or drag a photo to upload</p>
          {uploading && <p className="text-xs text-yellow-600 animate-pulse">Uploading…</p>}
          {uploadError && (
            <p className="text-xs text-amber-600 text-center leading-relaxed">{uploadError}</p>
          )}
        </div>
      )}

      {tab === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="button"
            onClick={applyUrl}
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold px-3 rounded-lg transition-colors"
          >
            Set
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {/* Preview */}
      {preview && (
        <div className="mt-3 space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="h-36 w-full object-cover rounded-lg border border-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex-1 truncate">{preview}</span>
            <button
              type="button"
              onClick={clear}
              className="text-xs text-red-500 hover:underline shrink-0"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
