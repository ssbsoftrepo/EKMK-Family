import React, { useEffect, useRef, useState } from 'react';
import { HomePhoto } from './HomePhoto';
import { FamilyPassword } from './FamilyPassword';
import { SecretDrawerSettings } from './SecretDrawerSettings';
import { useToast } from '../../context/ToastContext';
import { useAdmin } from '../../context/AdminContext';
import { familyApi, SiteSettings } from '../../api/familyApi';
import { StepTitle, btnPrimary, btnSecondary, card, Check } from './ui';

type Key = keyof SiteSettings;

/**
 * Step 3: the website link, family password, and photos.
 */
export const ShareStep: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<Partial<SiteSettings>>({});

  useEffect(() => {
    familyApi.getSettings().then(setSettings).catch((e) => toast.error('Could not load settings', e instanceof Error ? e.message : undefined));
    return () => window.clearTimeout(timer.current);
  }, [toast]);

  // For immediate saves (photo uploads, photo removals)
  const saveImmediate = async (partial: Partial<SiteSettings>) => {
    window.clearTimeout(timer.current);
    const changes = { ...pending.current, ...partial };
    pending.current = {};
    setSaved('saving');
    // Optimistically update local state so preview updates immediately
    setSettings((s) => (s ? { ...s, ...partial } : s));
    try {
      const fresh = await familyApi.saveSettings(changes);
      setSettings(fresh);
      setSaved('saved');
    } catch (e) {
      setSaved('idle');
      toast.error('Could not save settings', e instanceof Error ? e.message : undefined);
      throw e;
    }
  };

  // For text fields (debounced so we don't save on every keystroke)
  const changeDebounced = (key: Key, value: string) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    pending.current = { ...pending.current, [key]: value };
    setSaved('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const changes = pending.current;
      pending.current = {};
      try {
        const fresh = await familyApi.saveSettings(changes);
        setSettings(fresh);
        setSaved('saved');
      } catch (e) {
        setSaved('idle');
        toast.error('Could not save', e instanceof Error ? e.message : undefined);
      }
    }, 700);
  };

  const copyLink = async () => {
    if (!settings?.siteUrl.trim()) return;
    try {
      await navigator.clipboard.writeText(settings.siteUrl.trim());
      toast.success('Link copied', 'Paste it anywhere');
    } catch {
      toast.info('Select the link and copy it', settings.siteUrl.trim());
    }
  };

  return (
    <>
      <StepTitle step="step 3 of 3" title="Share the link">
        Share the family website link, set a family password, and personalize the home photo.
      </StepTitle>

      {!settings ? (
        <span className="font-hand text-[22px]">loading…</span>
      ) : (
        <>
          <section className={`${card} shadow-pop flex flex-col gap-3`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <label className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
                <span className="text-xl font-extrabold">The family website’s address</span>
                <span className="text-base">The link people open, for example https://kmkfamily.in</span>
                <input value={settings.siteUrl} onChange={(e) => changeDebounced('siteUrl', e.target.value)} inputMode="url" placeholder="https://"
                  className="min-h-[56px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-lg font-album text-album-leaf max-w-[560px]" />
              </label>
              <span className="flex items-center gap-1.5 text-[15px] font-bold" aria-live="polite">
                {saved === 'saving' && 'Saving…'}
                {saved === 'saved' && <><Check className="w-5 h-5" color="#5C8A4A" /> Saved</>}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={btnPrimary} onClick={copyLink} disabled={!settings.siteUrl.trim()}>Copy link</button>
            </div>
          </section>

          <FamilyPassword siteUrl={settings.siteUrl} />

          <HomePhoto url={settings.homePhotoUrl} onChange={(url) => saveImmediate({ homePhotoUrl: url })} />

          <EldersCouplePhoto />

          <SecretDrawerSettings note={settings.secretNote} photoUrl={settings.secretPhotoUrl}
            onNote={(v) => changeDebounced('secretNote', v)} onPhoto={(url) => saveImmediate({ secretPhotoUrl: url })} />
        </>
      )}
    </>
  );
};

/** The first generation elders' couple photo, displayed on the website home page (until a group photo is added) and in the family album. */
const EldersCouplePhoto: React.FC = () => {
  const { members, refreshData } = useAdmin();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const founders = members.filter((m) => m.generation === 1);
  if (founders.length === 0) return null;

  const currentPhoto = founders.find((f) => f.couplePhotoUrl)?.couplePhotoUrl || '';
  const foundersNames = founders.map((f) => f.fullName).join(' & ');

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await familyApi.uploadPhoto(file);
      for (const f of founders) {
        await familyApi.updateMember(f.id, { couplePhotoUrl: res.url });
      }
      await refreshData();
      toast.success('Couple photo updated', 'Saved for the first generation elders');
    } catch (e) {
      toast.error('Could not upload the couple photo', e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setUploading(true);
    try {
      for (const f of founders) {
        await familyApi.updateMember(f.id, { couplePhotoUrl: '' });
      }
      await refreshData();
      toast.success('Couple photo removed');
    } catch (e) {
      toast.error('Could not remove photo', e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className={`${card} flex flex-wrap gap-5 items-center border-2 border-album-turmeric`}>
      <div className="flex-[1_1_260px] max-w-[360px] bg-white p-2 rounded-[10px] shadow-[0_8px_20px_rgba(30,70,54,0.16)] rotate-1">
        <div className="aspect-[16/10] rounded-md bg-album-peach overflow-hidden flex items-center justify-center">
          {currentPhoto ? (
            <img src={currentPhoto} alt="First generation couple" className="w-full h-full object-cover" />
          ) : (
            <span className="font-hand text-xl text-album-leaf">no couple photo yet</span>
          )}
        </div>
      </div>
      <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-album-turmeric text-album-leaf flex items-center justify-center text-xs font-extrabold">1st</span>
          <h2 className="font-album text-[1.5rem] font-extrabold m-0" style={{ letterSpacing: 0 }}>
            First generation couple photo
          </h2>
        </div>
        <p className="m-0 text-[17px]">
          {foundersNames ? <>Portrait of <strong>{foundersNames}</strong> together.</> : 'Portrait of the elders together.'}{' '}
          Shown on the family website home page (until a family group photo is added) and at the top of the tree.
        </p>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={btnPrimary} disabled={uploading} onClick={() => input.current?.click()}>
            {uploading ? 'Uploading…' : currentPhoto ? 'Change couple photo' : 'Upload couple photo'}
          </button>
          {currentPhoto && (
            <button type="button" className={btnSecondary} disabled={uploading} onClick={remove}>
              Remove
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
