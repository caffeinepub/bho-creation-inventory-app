import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Scan, BarChart3, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useLoginWithCredentials } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const loginWithCredentials = useLoginWithCredentials();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credentialError, setCredentialError] = useState('');

  const isLoggingIn = loginStatus === 'logging-in';
  const isCredentialLoading = loginWithCredentials.isPending;

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError('');

    if (!username.trim() || !password.trim()) {
      setCredentialError('Please enter both username and password');
      return;
    }

    try {
      await loginWithCredentials.mutateAsync({ username, password });
      navigate({ to: '/' });
    } catch (error: any) {
      setCredentialError(error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Branding and Features */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Logo and Title */}
              <div className="space-y-6 fade-in">
                <div className="inline-flex items-center justify-center lg:justify-start">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-3xl blur-xl opacity-50"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl">
                      <Package className="w-10 h-10 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                    Bho Creation
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Modern Fabric Inventory Management
                  </p>
                </div>
              </div>

              {/* Feature highlights */}
              <div className="space-y-4 max-w-md mx-auto lg:mx-0">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] feature-card">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Scan className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-1">Smart Barcode Scanning</h3>
                    <p className="text-sm text-muted-foreground">Instant rack identification and inventory updates</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] feature-card" style={{ animationDelay: '0.1s' }}>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-1">Real-time Stock Control</h3>
                    <p className="text-sm text-muted-foreground">Track fabric quantities with precision</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] feature-card" style={{ animationDelay: '0.2s' }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-1">Cloud Synchronization</h3>
                    <p className="text-sm text-muted-foreground">Access your data anywhere, anytime</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login Card */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="relative login-card">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-50"></div>
                  
                  {/* Card content */}
                  <div className="relative bg-card rounded-3xl p-8 lg:p-10 shadow-2xl border border-border/50 backdrop-blur-sm">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold text-foreground">
                          Welcome Back
                        </h2>
                        <p className="text-muted-foreground">
                          Sign in to access your inventory
                        </p>
                      </div>

                      {/* Username/Password Login Form */}
                      <form onSubmit={handleCredentialLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-medium text-foreground">
                            Username
                          </Label>
                          <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isCredentialLoading}
                            className="h-12 rounded-xl border-border/50 focus:border-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-foreground">
                            Password
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isCredentialLoading}
                            className="h-12 rounded-xl border-border/50 focus:border-primary"
                          />
                        </div>

                        {credentialError && (
                          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                            {credentialError}
                          </div>
                        )}

                        <Button
                          type="submit"
                          disabled={isCredentialLoading}
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group relative overflow-hidden"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                          {isCredentialLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                              Signing in...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Sign In
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </Button>
                      </form>

                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      {/* Internet Identity Login Button */}
                      <div className="space-y-4">
                        <Button
                          onClick={login}
                          disabled={isLoggingIn}
                          variant="outline"
                          className="w-full h-12 text-base font-semibold border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all duration-300"
                        >
                          {isLoggingIn ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              Connecting...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Internet Identity
                            </span>
                          )}
                        </Button>

                        {/* Security badge */}
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          <span>Secured by blockchain technology</span>
                        </div>
                      </div>

                      {/* Info text */}
                      <p className="text-center text-sm text-muted-foreground">
                        Your data is encrypted and stored securely on the Internet Computer blockchain
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
