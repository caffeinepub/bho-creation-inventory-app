import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, Image as ImageIcon, Package } from 'lucide-react';
import type { FabricInventoryEntry } from '../backend';
import ImageLightbox from './ImageLightbox';

interface InventoryDetailModalProps {
  rackId: string;
  entry: FabricInventoryEntry;
  onClose: () => void;
}

export default function InventoryDetailModal({ rackId, entry, onClose }: InventoryDetailModalProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isLowStock = entry.quantity < 10;
  const isOutOfStock = entry.quantity === 0;

  const formatDate = (timestamp?: bigint): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) / 1_000_000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Fabric Entry Details</DialogTitle>
            <DialogDescription>
              Complete information for this fabric inventory entry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Fabric Photo */}
            {entry.fabricPhoto && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <ImageIcon className="w-4 h-4" />
                  Fabric Photo
                </div>
                <button
                  onClick={() => setLightboxImage(entry.fabricPhoto!.getDirectURL())}
                  className="w-full rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:ring-2 hover:ring-amber-500 transition-all"
                >
                  <img
                    src={entry.fabricPhoto.getDirectURL()}
                    alt={entry.fabricName}
                    className="w-full h-64 object-cover"
                  />
                </button>
              </div>
            )}

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Fabric Name
                </div>
                <div className="text-lg font-medium">{entry.fabricName}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Rack ID
                </div>
                <code className="inline-block px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded text-base">
                  {entry.rackId}
                </code>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Quantity
                </div>
                <div className="text-lg font-semibold">{entry.quantity.toFixed(2)} meters</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Stock Status
                </div>
                <div>
                  {isOutOfStock ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : isLowStock ? (
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Low Stock</Badge>
                  ) : (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white">In Stock</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Purchase Date */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Purchase Date
              </div>
              <div className="text-base">{formatDate(entry.purchaseDate)}</div>
            </div>

            {/* Bill Photo */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bill / Receipt Photo
              </div>
              {entry.billPhoto ? (
                <button
                  onClick={() => setLightboxImage(entry.billPhoto!.getDirectURL())}
                  className="w-full rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:ring-2 hover:ring-amber-500 transition-all"
                >
                  <img
                    src={entry.billPhoto.getDirectURL()}
                    alt="Bill receipt"
                    className="w-full h-64 object-cover"
                  />
                </button>
              ) : (
                <div className="w-full h-32 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                  <div className="text-center text-neutral-500 dark:text-neutral-400">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No bill uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={onClose} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </>
  );
}
