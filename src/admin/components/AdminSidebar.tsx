import { useLocation, Link } from 'wouter';
import { useAdminData } from '../AdminDataProvider';

interface NavItem {
  label: string;
  href: string;
  count?: number;
}

export function AdminSidebar() {
  const [location] = useLocation();
  const { appData } = useAdminData();

  const navItems: NavItem[] = [
    { label: 'Overview', href: '/' },
    { label: 'Content Queue', href: '/queue' },
    { label: 'Roadmap', href: '/roadmap' },
  ];

  const counts = [
    { label: 'Stories', count: appData.stories.length },
    { label: 'Moments', count: appData.moments.length },
    { label: 'Entities', count: appData.entities.length },
    { label: 'Collections', count: appData.collections.length },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/' || location === '';
    return location.startsWith(href);
  };

  return (
    <div className="w-[240px] flex-shrink-0 bg-[#0d0d0d] border-r border-[#2a2a2a] flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-[#2a2a2a]">
        <Link href="/" className="block">
          <div className="text-sm font-bold text-gray-200 tracking-wide"><span className="text-[#e74c3c]">Deep</span>Maps</div>
          <div className="text-xs text-red-500 font-mono mt-0.5">admin</div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 text-sm transition-colors ${
              isActive(item.href)
                ? 'text-red-400 bg-red-500/5 border-r-2 border-red-500'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#111]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Counts */}
      <div className="border-t border-[#2a2a2a] px-4 py-3">
        <div className="text-xs text-gray-600 font-mono mb-2">DATA</div>
        {counts.map(c => (
          <div key={c.label} className="flex items-center justify-between py-0.5">
            <span className="text-xs text-gray-500">{c.label}</span>
            <span className="text-xs text-gray-400 font-mono">{c.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
