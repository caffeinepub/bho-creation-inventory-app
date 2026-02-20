# Specification

## Summary
**Goal:** Add fabric editing capabilities and enhance barcode scanning to auto-select fabrics with quantity adjustment controls.

**Planned changes:**
- Add edit button to each fabric entry in the inventory list that opens a modal for updating fabric details (name, rack ID, quantity, purchase date, photos)
- Create backend function to update fabric entries while preserving audit trail
- Enhance barcode scanning to automatically select fabrics matching the scanned code (by name or rack ID)
- Update quantity adjustment interface to support both increasing and decreasing fabric quantities
- Modify backend quantity functions to handle both positive and negative adjustments
- Implement automatic fabric selection logic in ScanPage based on barcode matches

**User-visible outcome:** Users can edit any fabric details through an edit button in the inventory list. When scanning a barcode, the matching fabric automatically appears with simple controls to increase or decrease its quantity, streamlining inventory updates.
