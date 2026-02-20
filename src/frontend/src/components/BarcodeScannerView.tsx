import { useEffect } from 'react';
import { useQRScanner } from '../qr-code/useQRScanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, SwitchCamera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BarcodeScannerViewProps {
  onRackSelected: (rackId: string) => void;
}

export default function BarcodeScannerView({ onRackSelected }: BarcodeScannerViewProps) {
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 100,
    maxResults: 10,
  });

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (qrResults.length > 0) {
      onRackSelected(qrResults[0].data);
    }
  }, [qrResults, onRackSelected]);

  if (isSupported === false) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera is not supported on this device or browser
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barcode Scanner</CardTitle>
        <CardDescription>
          Scan a rack barcode to identify the fabric
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Preview */}
        <div className="relative bg-neutral-900 rounded-lg overflow-hidden w-full" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {!isActive && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera is off</p>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Scanning...
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            onClick={startScanning}
            disabled={!canStartScanning || isLoading}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white min-h-[44px] py-3 px-6"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Starting...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </>
            )}
          </Button>
          <Button
            onClick={stopScanning}
            disabled={isLoading || !isActive}
            variant="outline"
            className="flex-1 min-h-[44px] py-3 px-6"
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Camera
          </Button>
          {isMobile && (
            <Button
              onClick={switchCamera}
              disabled={isLoading || !isActive}
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
            >
              <SwitchCamera className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Scan Results */}
        {qrResults.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Scanned Barcodes ({qrResults.length})
              </h4>
              <Button onClick={clearResults} variant="ghost" size="sm" className="min-h-[44px]">
                Clear
              </Button>
            </div>
            <ScrollArea className="h-32 rounded-md border border-neutral-200 dark:border-neutral-700 p-2">
              <div className="space-y-2">
                {qrResults.map((result) => (
                  <div
                    key={result.timestamp}
                    className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono text-neutral-900 dark:text-neutral-50 break-all">
                        {result.data}
                      </code>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
