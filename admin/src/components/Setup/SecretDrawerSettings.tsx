import React, { useRef, useState } from 'react';
import { familyApi } from '../../api/familyApi';
import { useToast } from '../../context/ToastContext';
import { btnDark, btnSecondary, card } from './ui';

/**
 * The easter egg on the family website: tapping the KMK logo five times opens a
 * "secret family drawer". The admin decides what is inside.
 */
export const SecretDrawerSettings: React.FC<{
  note: string; photoUrl: string; onNote: (v: string) => void; onPhoto: (url: string) => void;
}> = ({ note, photoUrl, onNote, onPhoto }) => {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      onPhoto((await familyApi.uploadPhoto(file)).url);
    } catch (e) {
      toast.error('Could not upload the photo', e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <section className={`${card} border-[3px] border-dashed border-album-turmeric flex flex-col gap-3`}>
      <div className="flex flex-col">
        <span className="font-hand text-[22px] leading-none text-album-terracotta">shh… a secret</span>
        <h2 className="font-album text-[1.5rem] font-extrabold m-0" style={{ letterSpacing: 0 }}>Secret family drawer</h2>
      </div>
      <p className="m-0 text-[17px]">
        On the family website, tapping the <strong>KMK</strong> logo five times opens a hidden drawer. Put something special in it: an old family photo, Paati’s recipe, or a story from the elders.
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-[16px] font-bold">What’s inside</span>
        <textarea value={note} onChange={(e) => onNote(e.target.value)} rows={5} maxLength={1000}
          placeholder="e.g. Paati’s murukku: 2 cups rice flour, ½ cup urad dal flour…"
          className="rounded-2xl border-2 border-album-leaf bg-album-paper p-3.5 text-[17px] font-album text-album-leaf leading-snug" />
      </label>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      <div className="flex flex-wrap items-center gap-3">
        {photoUrl && <img src={photoUrl} alt="In the secret drawer" className="w-28 h-20 object-cover rounded-lg border-2 border-white shadow" />}
        <button type="button" className={btnDark} disabled={uploading} onClick={() => input.current?.click()}>
          {uploading ? 'Uploading…' : photoUrl ? 'Change the photo' : 'Add an old photo'}
        </button>
        {photoUrl && <button type="button" className={`${btnSecondary} min-h-[52px]`} onClick={() => onPhoto('')}>Remove photo</button>}
      </div>
    </section>
  );
};
