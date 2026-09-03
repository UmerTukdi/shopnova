'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, Download } from 'lucide-react';

export default function OrderInvoiceButton() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('print') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
      >
        <Printer className="w-4 h-4" />
        <span>Print Receipt</span>
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-sm"
      >
        <Download className="w-4 h-4 text-slate-500" />
        <span>Download Receipt (PDF)</span>
      </button>
    </div>
  );
}
