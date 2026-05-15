export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-edge bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs text-mist md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="heading-ui text-gold">LongevityIQ</p>
          <p className="font-body">
            Luxury big-city longevity healthcare for the sovereign and urban communities.
          </p>
        </div>
        <div className="space-y-1 md:text-right">
          <p>
            Powered by Sovereign Shield Technologies LLC &middot; AES-256-GCM &middot;
            Zero-Knowledge &middot; Your data is never sold
          </p>
          <p>
            &copy; {year} Sovereign Shield Technologies LLC &middot; Ada, Oklahoma &middot;
            Founded by an enrolled Chickasaw citizen.
          </p>
        </div>
      </div>
    </footer>
  )
}
