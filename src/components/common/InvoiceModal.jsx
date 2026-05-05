import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Button } from '../ui/button';

export function InvoiceModal({ invoice, onClose, loading }) {
  if (!invoice && !loading) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card-bg border border-border-subtle w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
        <div className="sticky top-0 bg-card-bg border-b border-border-subtle p-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-bold text-text-main">Invoice Details #{invoice?.invoice_number}</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="h-8 px-3 text-xs gap-2 border-primary text-primary">
              <Printer size={14} /> Print / PDF
            </Button>
            <button onClick={onClose} className="p-1 hover:bg-dashboard-bg rounded-full text-text-muted">
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-primary font-bold">Loading Invoice Data...</div>
        ) : (
          <div id="printable-invoice" className="p-8 text-text-main">
            <div className="flex justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-primary mb-1 tracking-tighter">ROAD OZ</h1>
                <p className="text-xs text-text-muted italic">Courier Management System</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold uppercase">Invoice</h2>
                <p className="text-sm text-text-muted">#{invoice.invoice_number}</p>
                <p className="text-xs text-text-muted mt-1">Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 border-y border-border-subtle py-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Billed To:</p>
                <p className="font-bold">Franchise ID: {invoice.franchise_id}</p>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{invoice.description}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Period:</p>
                <p className="text-sm">{new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}</p>
                <p className="mt-2 text-xs uppercase font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded inline-block">
                  Status: {invoice.status}
                </p>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[11px] uppercase font-bold text-text-muted">
                  <th className="py-3">Order ID</th>
                  <th className="py-3">Created At</th>
                  <th className="py-3 text-right">Shipping Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {invoice.invoice_orders?.map((order) => (
                  <tr key={order.id} className="text-sm">
                    <td className="py-4 font-mono text-xs">{order.order_id}</td>
                    <td className="py-4 text-text-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-4 text-right font-bold">₹ {order.shipping_charge.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 border-t border-border-subtle pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal:</span>
                  <span>₹ {invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Tax ({invoice.tax_rate}%):</span>
                  <span>₹ {invoice.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border-subtle pt-2 text-primary">
                  <span>Total:</span>
                  <span>₹ {invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}