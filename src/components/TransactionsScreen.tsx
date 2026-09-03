import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Printer, 
  Calendar, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Eye, 
  Ban, 
  Download, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle2, 
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Transaction, StoreProfile, PaymentMethod } from '../types';
import { formatRupiah, formatDateTimeIndonesian } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { ReceiptModal } from './ReceiptModal';
import { useLanguage } from '../i18n/LanguageContext';

export interface TransactionsScreenProps {
  transactions: Transaction[];
  storeProfile: StoreProfile;
  onCancelTransaction: (txId: string, restoreStock: boolean) => void;
}

export const TransactionsScreen = ({
  transactions,
  storeProfile,
  onCancelTransaction,
}: TransactionsScreenProps) => {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);
  const [txToCancel, setTxToCancel] = useState<Transaction | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = 
        tx.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.tableNumber && tx.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.items.some((i) => {
          const name = language === 'en' && i.menuItem.nameEn ? i.menuItem.nameEn : i.menuItem.name;
          return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.menuItem.name.toLowerCase().includes(searchQuery.toLowerCase());
        });

      const matchesMethod = methodFilter === 'all' || tx.paymentMethod === methodFilter;
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesDate = !dateFilter || tx.date === dateFilter;

      return matchesSearch && matchesMethod && matchesStatus && matchesDate;
    });
  }, [transactions, searchQuery, methodFilter, statusFilter, dateFilter, language]);

  // Aggregate metrics
  const totalCompletedAmount = filteredTransactions
    .filter((tx) => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.totalAmount, 0);

  const totalCompletedProfit = filteredTransactions
    .filter((tx) => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.profit, 0);

  const exportTransactionsCSV = () => {
    sounds.playBeep();
    const headers = [
      'No Struk',
      'Tanggal',
      'Waktu',
      'Pelanggan',
      'Meja/Lokasi',
      'Status',
      'Metode Bayar',
      'Subtotal (Rp)',
      'Diskon (Rp)',
      'Total Akhir (Rp)',
      'Total HPP Modal (Rp)',
      'Laba Bersih (Rp)',
      'Kasir',
      'Item Dipesan',
    ];

    const rows = filteredTransactions.map((tx) => {
      const itemSummary = tx.items.map((i) => {
        const name = language === 'en' && i.menuItem.nameEn ? i.menuItem.nameEn : i.menuItem.name;
        return `${i.quantity}x ${name}`;
      }).join('; ');
      return [
        tx.receiptNumber,
        tx.date,
        tx.time,
        `"${(tx.customerName || '-').replace(/"/g, '""')}"`,
        `"${(tx.tableNumber || '-').replace(/"/g, '""')}"`,
        tx.status === 'completed' ? 'Selesai' : 'Dibatalkan',
        tx.paymentMethod.toUpperCase(),
        tx.subtotal,
        tx.discount,
        tx.totalAmount,
        tx.costAmount,
        tx.profit,
        `"${tx.cashierName.replace(/"/g, '""')}"`,
        `"${itemSummary.replace(/"/g, '""')}"`,
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Riwayat_Transaksi_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCancelClick = (tx: Transaction) => {
    sounds.playBeep();
    setTxToCancel(tx);
  };

  const confirmCancelTransaction = (restoreStock: boolean) => {
    if (!txToCancel) return;
    sounds.playBeep();
    onCancelTransaction(txToCancel.id, restoreStock);
    setTxToCancel(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      
      {/* Top Banner & Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md shadow-slate-950/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-sky-400 border border-blue-500/30 shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-slate-100 text-base sm:text-lg">
              {t.txHistoryTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.txHistorySub}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-sm text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">{t.totalTxCount}</div>
            <div className="text-xs sm:text-sm font-extrabold text-sky-400 font-mono">
              {filteredTransactions.length} {t.receiptsCountSuffix} ({formatRupiah(totalCompletedAmount)})
            </div>
          </div>

          <button
            onClick={exportTransactionsCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsvBtn}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-md shadow-slate-950/20 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchTxPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'all')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">{t.allPayMethods}</option>
              <option value="cash">{t.payCash}</option>
              <option value="qris">{t.payQris}</option>
              <option value="transfer">{t.payTransfer}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'cancelled')}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="completed">{t.statusCompleted}</option>
              <option value="cancelled">{t.statusCancelled}</option>
            </select>

            {(searchQuery || dateFilter || methodFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('');
                  setMethodFilter('all');
                  setStatusFilter('all');
                }}
                title={t.allMenu}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t.colReceiptTime}</th>
                <th className="py-3 px-3">{t.colCustomerTable}</th>
                <th className="py-3 px-3">{t.colOrderedItems}</th>
                <th className="py-3 px-3">{t.colPayMethod}</th>
                <th className="py-3 px-3 text-right">{t.colTotalPaid}</th>
                <th className="py-3 px-3 text-right">{t.colProfit}</th>
                <th className="py-3 px-4 text-center">{t.colStatus}</th>
                <th className="py-3 px-4 text-right">{t.colTxAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((tx) => {
                const isCancelled = tx.status === 'cancelled';
                const totalItemQty = tx.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <tr 
                    key={tx.id} 
                    className={`transition-colors ${isCancelled ? 'opacity-50 bg-slate-950/40' : 'hover:bg-slate-850/60'}`}
                  >
                    
                    {/* No. Struk & Waktu */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 font-mono text-xs">
                        {tx.receiptNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatDateTimeIndonesian(tx.timestamp, language)}</span>
                      </div>
                    </td>

                    {/* Customer & Location */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{tx.customerName || t.defaultCustomer}</span>
                      </div>
                      <div className="text-[10px] text-sky-400/90 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{tx.tableNumber || (tx.orderType === 'dine_in' ? t.dineIn : t.takeaway)}</span>
                      </div>
                    </td>

                    {/* Items Summary */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="line-clamp-1 font-medium text-slate-300">
                        {tx.items.map((i) => {
                          const name = language === 'en' && i.menuItem.nameEn ? i.menuItem.nameEn : i.menuItem.name;
                          return `${i.quantity}x ${name}`;
                        }).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Total {totalItemQty} item
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-950 border border-slate-800 text-slate-200">
                        {tx.paymentMethod === 'cash' ? (
                          <>
                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t.payCash.toUpperCase()}</span>
                          </>
                        ) : tx.paymentMethod === 'qris' ? (
                          <>
                            <QrCode className="w-3.5 h-3.5 text-sky-400" />
                            <span>QRIS</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                            <span>TRANSFER</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-extrabold text-sky-400 font-mono text-xs sm:text-sm">
                        {formatRupiah(tx.totalAmount)}
                      </div>
                      {tx.discount > 0 && (
                        <div className="text-[10px] text-red-400">
                          {t.receiptDiscount}: -{formatRupiah(tx.discount)}
                        </div>
                      )}
                    </td>

                    {/* Profit */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                      {formatRupiah(tx.profit)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCancelled
                            ? 'bg-red-950 text-red-400 border border-red-800/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                        }`}
                      >
                        {isCancelled ? (
                          <>
                            <Ban className="w-3 h-3" />
                            {t.statusCancelled}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            {t.statusCompleted}
                          </>
                        )}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            sounds.playBeep();
                            setViewingReceiptTx(tx);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title={t.viewReceiptBtn}
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>{t.viewReceiptBtn}</span>
                        </button>

                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelClick(tx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title={t.cancelTxTooltip}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-700 opacity-60" />
            <p className="font-semibold text-slate-400">{t.noTxData}</p>
          </div>
        )}
      </div>

      {/* Modal View Receipt */}
      {viewingReceiptTx && (
        <ReceiptModal
          transaction={viewingReceiptTx}
          storeProfile={storeProfile}
          onClose={() => setViewingReceiptTx(null)}
        />
      )}

      {/* Cancel Transaction Modal */}
      {txToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                  {language === 'en' ? 'Cancel Transaction?' : 'Batalkan Transaksi?'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {txToCancel.receiptNumber} • {formatRupiah(txToCancel.totalAmount)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              {t.confirmCancelTx}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setTxToCancel(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="confirm-cancel-tx-btn"
                onClick={() => confirmCancelTransaction(true)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-950"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Cancel & Return Stock' : 'Batalkan & Pulihkan Stok'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
