import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const platforms = [
  {
    id: 'android',
    name: 'Android',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    descriptionKey: 'downloads.androidDesc',
    file: 'OMAR.apk',
    size: '~45 MB',
  },
  {
    id: 'windows',
    name: 'Windows',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
      </svg>
    ),
    descriptionKey: 'downloads.windowsDesc',
    file: 'OMAR-Setup.exe',
    size: '~80 MB',
  },
  {
    id: 'mac',
    name: 'macOS',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    descriptionKey: 'downloads.macDesc',
    file: 'OMAR.dmg',
    size: '~85 MB',
  },
  {
    id: 'linux',
    name: 'Linux',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    descriptionKey: 'downloads.linuxDesc',
    file: 'OMAR-x86_64.AppImage',
    size: '~75 MB',
  },
];

export default function Downloads() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 rounded-full mb-4 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}>
            {t('downloads.badge')}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            {t('downloads.heading')}
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-muted)' }}>
            {t('downloads.subtitle')}
          </p>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platforms.map((p) => (
            <div key={p.id} className="relative group cursor-pointer">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"
                style={{ backgroundColor: 'var(--color-primary)' }} />
              <div className="relative rounded-xl p-6 transition-all border"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>{p.name}</h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>{t(p.descriptionKey)}</p>
                    <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
                      <span>{p.file}</span>
                      <span>&bull;</span>
                      <span>{p.size}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg border flex items-center justify-center transition-all"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-primary)',
                      }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div className="h-full w-0 group-hover:w-full transition-all duration-700 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* GitHub link */}
        <div className="mt-12 text-center">
          <p className="text-xs">
            <a
              href="https://github.com/Amr1977/OMAR/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('downloads.viewReleases')} &rarr;
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
