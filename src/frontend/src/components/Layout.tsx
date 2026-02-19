import { ReactNode } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Scan, Plus, Shield } from 'lucide-react';
import LoginButton from './LoginButton';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';
import { UserRole } from '../backend';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { data: userProfile } = useGetCallerUserProfile();

  const currentPath = routerState.location.pathname;
  const isAdmin = userProfile?.role === UserRole.admin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/generated/boh-creation-logo.dim_200x200.png" 
                alt="Boh Creation Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                  Bho Creation
                </h1>
                {userProfile && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {userProfile.name}
                  </p>
                )}
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <Button
                onClick={() => navigate({ to: '/' })}
                variant={currentPath === '/' ? 'default' : 'ghost'}
                className={currentPath === '/' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' : ''}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => navigate({ to: '/scan' })}
                variant={currentPath === '/scan' ? 'default' : 'ghost'}
                className={currentPath === '/scan' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' : ''}
              >
                <Scan className="w-4 h-4 mr-2" />
                Scan
              </Button>
              <Button
                onClick={() => navigate({ to: '/add' })}
                variant={currentPath === '/add' ? 'default' : 'ghost'}
                className={currentPath === '/add' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' : ''}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Fabric
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => navigate({ to: '/admin' })}
                  variant={currentPath === '/admin' ? 'default' : 'ghost'}
                  className={currentPath === '/admin' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' : ''}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
            </nav>

            <LoginButton />
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-2 mt-4 overflow-x-auto">
            <Button
              onClick={() => navigate({ to: '/' })}
              variant={currentPath === '/' ? 'default' : 'outline'}
              size="sm"
              className={currentPath === '/' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white flex-1' : 'flex-1'}
            >
              <LayoutDashboard className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <Button
              onClick={() => navigate({ to: '/scan' })}
              variant={currentPath === '/scan' ? 'default' : 'outline'}
              size="sm"
              className={currentPath === '/scan' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white flex-1' : 'flex-1'}
            >
              <Scan className="w-4 h-4 mr-1" />
              Scan
            </Button>
            <Button
              onClick={() => navigate({ to: '/add' })}
              variant={currentPath === '/add' ? 'default' : 'outline'}
              size="sm"
              className={currentPath === '/add' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white flex-1' : 'flex-1'}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
            {isAdmin && (
              <Button
                onClick={() => navigate({ to: '/admin' })}
                variant={currentPath === '/admin' ? 'default' : 'outline'}
                size="sm"
                className={currentPath === '/admin' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white flex-1' : 'flex-1'}
              >
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-700 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            <p>
              © {new Date().getFullYear()} Bho Creation. Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
