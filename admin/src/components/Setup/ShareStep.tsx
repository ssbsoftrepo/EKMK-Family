import React, { useEffect, useRef, useState } from 'react';
import { HomePhoto } from './HomePhoto';
import { SecretDrawerSettings } from './SecretDrawerSettings';
import { useToast } from '../../context/ToastContext';
import { familyApi, SiteSettings } from '../../api/familyApi';
import { StepTitle, btnPrimary, btnSecondary, card, Check } from './ui';

type Key = keyof SiteSettings;

const MESSAGES: { key: Key; title: string; where: string; sample: string }[] = [
  { key: 'whatsappBirthday', title: 'Birthday wish', where: 'The "Wish them" button on someone’s birthday', sample: 'Nila' },
  { key: 'whatsappHello', title: 'Say hello', where: 'The WhatsApp button on each person’s page', sample: 'Mani' },
  { key: 'whatsappShare', title: 'Share the website', where: 'The message you send to the family WhatsApp group', sample: '' },
];

/** Fills {name} and {site} the same way the family website does. */
export const fillMessage = (template: string, name: string, site: string) =>
  template.split('{name}').join(name).split('{site}').join(site).replace(/\s+$/, '');

/**
 * Step 3: the website link and the WhatsApp messages.
 * WhatsApp needs no setup: the buttons are ordinary https://wa.me links that open
 * WhatsApp on the visitor's own phone with the message ready to send.
 */
export const ShareStep: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<Partial<SiteSettings>>({});

  useEffect(() => {
    familyApi.getSettings().then(setSettings).catch((e) => toast.error('Could not load the messages', e instanceof Error ? e.message : undefined));
    return () => window.clearTimeout(timer.current);
  }, [toast]);

  const change = (key: Key, value: string) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    pending.current = { ...pending.current, [key]: value };
    setSaved('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const changes = pending.current;
      pending.current = {};
      try {
        const fresh = await familyApi.saveSettings(changes);
        // Keep what the admin is typing; only fill back defaults for cleared messages.
        setSettings((s) => (s ? { ...fresh, ...Object.fromEntries(Object.entries(s).filter(([k, v]) => v !== '' || ['siteUrl', 'homePhotoUrl', 'secretNote', 'secretPhotoUrl'].includes(k))) } as SiteSettings : fresh));
        setSaved('saved');
      } catch (e) {
        setSaved('idle');
        toast.error('Could not save', e instanceof Error ? e.message : undefined);
      }
    }, 700);
  };

  const site = settings?.siteUrl?.trim() || 'the website link';
  const shareText = settings ? fillMessage(settings.whatsappShare, '', settings.siteUrl.trim()) : '';

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
        Send the website to the family WhatsApp group. Change the ready-made WhatsApp messages any time; the website uses them straight away.
      </StepTitle>

      {!settings ? (
        <span className="font-hand text-[22px]">loading…</span>
      ) : (
        <>
          <section className={`${card} shadow-[0_4px_0_#1E4636] flex flex-col gap-3`}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xl font-extrabold">The family website’s address</span>
              <span className="text-base">The link people open, for example https://kmkfamily.in</span>
              <input value={settings.siteUrl} onChange={(e) => change('siteUrl', e.target.value)} inputMode="url" placeholder="https://"
                className="min-h-[56px] rounded-2xl border-2 border-album-leaf bg-album-paper px-4 text-lg font-album text-album-leaf max-w-[560px]" />
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={btnSecondary} onClick={copyLink} disabled={!settings.siteUrl.trim()}>Copy link</button>
              <a className={`${btnPrimary} no-underline`} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
                Send to the WhatsApp group
              </a>
            </div>
            <span className="text-[15px]">“Send to the WhatsApp group” opens WhatsApp with the share message below. You pick the group and press send.</span>
          </section>

          <HomePhoto url={settings.homePhotoUrl} onChange={(url) => change('homePhotoUrl', url)} />

          <SecretDrawerSettings note={settings.secretNote} photoUrl={settings.secretPhotoUrl}
            onNote={(v) => change('secretNote', v)} onPhoto={(url) => change('secretPhotoUrl', url)} />

          <section className={`${card} flex flex-col gap-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-hand text-[22px] leading-none text-album-terracotta">ready-made messages</span>
                <h2 className="font-album text-[1.75rem] font-extrabold m-0" style={{ letterSpacing: 0 }}>WhatsApp messages</h2>
              </div>
              <span className="flex items-center gap-1.5 text-[15px] font-bold" aria-live="polite">
                {saved === 'saving' && 'Saving…'}
                {saved === 'saved' && <><Check className="w-5 h-5" color="#5C8A4A" /> Saved</>}
              </span>
            </div>
            <p className="m-0 text-[17px]">
              Write <strong>{'{name}'}</strong> where the person’s name should go and <strong>{'{site}'}</strong> for the website link.
              Nothing is sent automatically: the button opens WhatsApp on the visitor’s phone and they press send.
            </p>
            <div className="flex flex-wrap gap-5">
              {MESSAGES.map((m) => (
                <div key={m.key} className="flex-[1_1_320px] min-w-0 flex flex-col gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-lg font-extrabold">{m.title}</span>
                    <span className="text-[15px]">{m.where}</span>
                    <textarea value={settings[m.key]} onChange={(e) => change(m.key, e.target.value)} rows={4} maxLength={1000}
                      className="rounded-2xl border-2 border-album-leaf bg-album-paper p-3.5 text-[17px] font-album text-album-leaf leading-snug" />
                  </label>
                  <span className="text-sm font-bold">How it will look</span>
                  <span className="bg-[#DCF8C6] text-[#111] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[16px] whitespace-pre-wrap self-start max-w-full">
                    {fillMessage(settings[m.key] || '…', m.sample || '', site) || '…'}
                  </span>
                  {settings[m.key].trim() === '' && <span className="text-sm">Left empty, the website goes back to the original message.</span>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
};
