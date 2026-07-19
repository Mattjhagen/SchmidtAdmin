import SettingsClient from '@/components/SettingsClient';

// Server component — reads server-only env vars and passes them as props.
// EMAIL_OVERRIDE_TO must never be exposed to browser JS, so it is read here
// and forwarded as a plain string prop (present = override active, null = off).
export default function SettingsPage() {
  const emailOverrideTo = process.env.EMAIL_OVERRIDE_TO?.trim() || null;

  return <SettingsClient emailOverrideTo={emailOverrideTo} />;
}
