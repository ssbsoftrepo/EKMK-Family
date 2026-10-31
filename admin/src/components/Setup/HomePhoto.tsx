import React, { useRef, useState } from 'react';
import { familyApi } from '../../api/familyApi';
import { useToast } from '../../context/ToastContext';
import { btnPrimary, btnSecondary, card } from './ui';

/** The big photo on the family website's home page (a family group photo works best). */
export const HomePhoto: React.FC<{ url: string; onChange: (url: string) => void }> = ({ url, onChange }) => {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await familyApi.uploadPhoto(file);
      onChange(res.url);
      toast.success('Photo added', 'It is now on the home page');
    } catch (e) {
      toast.error('Could not upload the photo', e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <section className={`${card} flex flex-wrap gap-5 items-center`}>
      <div className="flex-[1_1_260px] max-w-[360px] bg-white p-2 rounded-[10px] shadow-[0_8px_20px_rgba(30,70,54,0.16)] -rotate-1">
        <div className="aspect-[16/10] rounded-md bg-album-peach overflow-hidden flex items-center justify-center">
          {url ? <img src={url} alt="Home page photo" className="w-full h-full object-cover" /> : <span className="font-hand text-xl text-album-leaf">no photo yet</span>}
        </div>
      </div>
      <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-2.5">
        <h2 className="font-album text-[1.5rem] font-extrabold m-0" style={{ letterSpacing: 0 }}>Home page photo</h2>
        <p className="m-0 text-[17px]">The first thing everyone sees. A big family group photo works best. Until one is added, the elders’ couple photo is used.</p>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={btnPrimary} disabled={uploading} onClick={() => input.current?.click()}>
            {uploading ? 'Uploading…' : url ? 'Change photo' : 'Upload a photo'}
          </button>
          {url && <button type="button" className={btnSecondary} onClick={() => onChange('')}>Remove</button>}
        </div>
      </div>
    </section>
  );
};
