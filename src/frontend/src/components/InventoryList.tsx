import { useState, useMemo } from 'react';
import { useGetInventory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, AlertCircle, Image as ImageIcon, Eye, Search, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImageLightbox from './ImageLightbox';
import InventoryDetailModal from './InventoryDetailModal';
import type { FabricInventoryEntry } from '../backend';

export default function InventoryList() {
  const { data: inventory, isLoading, error } = useGetInventory();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<{ rackId: string; entry: FabricInventoryEntry } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter inventory based on search term
  const filteredInventory = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    if (!searchTerm.trim()) return inventory;

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return inventory.filter(([rackId, entry]) => {
      const fabricNameMatch = entry.fabricName.toLowerCase().includes(lowerSearchTerm);
      const rackIdMatch = rackId.toLowerCase().includes(lowerSearchTerm);
      return fabricNameMatch || rackIdMatch;
    });
  }, [inventory, searchTerm]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading inventory...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load inventory: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!inventory || inventory.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              No Fabric Entries Yet
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Start by adding your first fabric entry to the inventory
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSearchResults = filteredInventory.length > 0;
  const isSearching = searchTerm.trim().length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Fabric Inventory</CardTitle>
          <CardDescription>
            {inventory.length} {inventory.length === 1 ? 'entry' : 'entries'} in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search by fabric name or rack ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-11 border-neutral-300 dark:border-neutral-600 focus:ring-amber-500 focus:border-amber-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Results or Empty State */}
          {!hasSearchResults && isSearching ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-amber-600 dark:text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                No Results Found
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                No fabrics match "{searchTerm}". Try a different search term.
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50 dark:bg-neutral-800/50">
                    <TableHead className="font-semibold w-20">Photo</TableHead>
                    <TableHead className="font-semibold">Fabric Name</TableHead>
                    <TableHead className="font-semibold">Rack ID</TableHead>
                    <TableHead className="font-semibold text-right">Quantity</TableHead>
                    <TableHead className="font-semibold text-right">Status</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map(([rackId, entry]) => {
                    const isLowStock = entry.quantity < 10;
                    const isOutOfStock = entry.quantity === 0;

                    return (
                      <TableRow key={rackId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                        <TableCell>
                          {entry.fabricPhoto ? (
                            <button
                              onClick={() => setLightboxImage(entry.fabricPhoto!.getDirectURL())}
                              className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:ring-2 hover:ring-amber-500 transition-all"
                            >
                              <img
                                src={entry.fabricPhoto.getDirectURL()}
                                alt={entry.fabricName}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                              <ImageIcon className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{entry.fabricName}</TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                            {entry.rackId}
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {entry.quantity.toFixed(2)} m
                        </TableCell>
                        <TableCell className="text-right">
                          {isOutOfStock ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailEntry({ rackId, entry })}
                            className="hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      {detailEntry && (
        <InventoryDetailModal
          rackId={detailEntry.rackId}
          entry={detailEntry.entry}
          onClose={() => setDetailEntry(null)}
        />
      )}
    </>
  );
}
