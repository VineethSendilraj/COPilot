import { headers } from 'next/headers';
import { getAppConfig } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const hdrs = await headers();
  const { companyName, logo, logoDark } = await getAppConfig(hdrs);

  return (
    <>
      <header className="fixed top-0 left-0 z-50 hidden w-full flex-row justify-between p-6 md:flex">
        <div className="scale-100 transition-transform duration-300 hover:scale-110">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={`${companyName} Logo`} className="block size-6 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDark ?? logo}
            alt={`${companyName} Logo`}
            className="hidden size-6 dark:block"
          />
        </div>
        <span className="text-foreground font-mono text-xs font-bold tracking-wider uppercase">
          Powered by AI
        </span>
      </header>
      {children}
    </>
  );
}
