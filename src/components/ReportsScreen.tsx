import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Printer, 
  Download, 
  Award, 
  PieChart, 
  Clock, 
  Sparkles,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Transaction, StoreProfile, ReportPeriod } from '../types';
import { formatRupiah, formatNumber, getCategoryLabel, formatDateIndonesian } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';
import { generateReportPdf } from '../utils/pdfGenerator';

export interface ReportsScreenProps {
  transactions: Transaction[];
  storeProfile: StoreProfile;
}

export const ReportsScreen = ({
  transactions,
  storeProfile,
}: ReportsScreenProps) => {
  const { language, t } = useLanguage();
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);
  const [hoveredTimelineIndex, setHoveredTimelineIndex] = useState<number | null>(null);

  // Filter transactions by period
  const { filteredTx, periodLabel } = useMemo(() => {
    const validTx = transactions.filter((t) => t.status === 'completed');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'today') {
      return {
        filteredTx: validTx.filter((tx) => tx.date === todayStr),
        periodLabel: `${t.periodToday} (${formatDateIndonesian(todayStr, language)})`,
      };
    }

    if (period === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return {
        filteredTx: validTx.filter((tx) => tx.date === yesterdayStr),
        periodLabel: `${t.periodYesterday} (${formatDateIndonesian(yesterdayStr, language)})`,
      };
    }

    if (period === 'weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      return {
        filteredTx: validTx.filter((tx) => tx.date >= sevenDaysAgoStr && tx.date <= todayStr),
        periodLabel: t.periodWeekly,
      };
    }

    if (period === 'monthly') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      return {
        filteredTx: validTx.filter((tx) => tx.date >= thirtyDaysAgoStr && tx.date <= todayStr),
        periodLabel: t.periodMonthly,
      };
    }

    if (period === 'yearly') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfYearStr = startOfYear.toISOString().split('T')[0];
      return {
        filteredTx: validTx.filter((tx) => tx.date >= startOfYearStr && tx.date <= todayStr),
        periodLabel: `${t.periodYearly} (${now.getFullYear()})`,
      };
    }

    if (period === 'custom') {
      return {
        filteredTx: validTx.filter((tx) => {
          if (customStartDate && tx.date < customStartDate) return false;
          if (customEndDate && tx.date > customEndDate) return false;
          return true;
        }),
        periodLabel: `${t.periodCustom} (${customStartDate || 'Awal'} s/d ${customEndDate || 'Sekarang'})`,
      };
    }

    return { filteredTx: validTx, periodLabel: language === 'en' ? 'All Time' : 'Semua Waktu' };
  }, [transactions, period, customStartDate, customEndDate, language, t]);

  // Aggregate Key Performance Indicators (KPIs)
  const totalRevenue = filteredTx.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalCost = filteredTx.reduce((sum, tx) => sum + tx.costAmount, 0);
  const totalProfit = filteredTx.reduce((sum, tx) => sum + tx.profit, 0);
  const profitMarginPct = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const transactionCount = filteredTx.length;
  const averageOrderValue = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;
  
  const totalUnitsSold = filteredTx.reduce(
    (sum, tx) => sum + tx.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  // Top Selling Items (Best Sellers)
  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; nameEn?: string; category: string; qty: number; revenue: number; unit: string }>();

    filteredTx.forEach((tx) => {
      tx.items.forEach((item) => {
        const key = item.menuItem.id;
        const current = itemMap.get(key) || {
          name: item.menuItem.name,
          nameEn: item.menuItem.nameEn,
          category: item.menuItem.category,
          qty: 0,
          revenue: 0,
          unit: item.menuItem.unit,
        };
        current.qty += item.quantity;
        current.revenue += item.subtotal;
        itemMap.set(key, current);
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [filteredTx]);

  // Sales by Category
  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, { label: string; revenue: number; qty: number }>();
    const categories = ['nasi', 'sate', 'gorengan', 'minuman', 'camilan', 'lainnya'];
    
    categories.forEach((cat) => {
      catMap.set(cat, { label: getCategoryLabel(cat, language), revenue: 0, qty: 0 });
    });

    filteredTx.forEach((tx) => {
      tx.items.forEach((item) => {
        const cat = item.menuItem.category || 'lainnya';
        const current = catMap.get(cat) || { label: getCategoryLabel(cat, language), revenue: 0, qty: 0 };
        current.revenue += item.subtotal;
        current.qty += item.quantity;
        catMap.set(cat, current);
      });
    });

    return Array.from(catMap.entries()).map(([key, val]) => ({
      key,
      ...val,
      pct: totalRevenue > 0 ? Math.round((val.revenue / totalRevenue) * 100) : 0,
    }));
  }, [filteredTx, totalRevenue, language]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let qris = 0;
    let transfer = 0;

    filteredTx.forEach((tx) => {
      if (tx.paymentMethod === 'cash') cash += tx.totalAmount;
      else if (tx.paymentMethod === 'qris') qris += tx.totalAmount;
      else transfer += tx.totalAmount;
    });

    return [
      { method: t.payCash, amount: cash, count: filteredTx.filter((t) => t.paymentMethod === 'cash').length, color: 'bg-emerald-500' },
      { method: 'QRIS', amount: qris, count: filteredTx.filter((t) => t.paymentMethod === 'qris').length, color: 'bg-amber-500' },
      { method: t.payTransfer, amount: transfer, count: filteredTx.filter((t) => t.paymentMethod === 'transfer').length, color: 'bg-orange-500' },
    ];
  }, [filteredTx, t]);

  // Timeline chart data (Daily: by hour; Weekly/Monthly: by date)
  const timelineData = useMemo(() => {
    if (period === 'today' || period === 'yesterday') {
      // Group by hours 17:00 to 24:00
      const hours = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];
      const data = hours.map((h) => ({
        label: h,
        revenue: 0,
        profit: 0,
        count: 0,
      }));

      filteredTx.forEach((tx) => {
        const hourNum = parseInt(tx.time?.split(':')[0] || '17', 10);
        let idx = hourNum - 17;
        if (idx < 0) idx = 0;
        if (idx >= data.length) idx = data.length - 1;
        data[idx].revenue += tx.totalAmount;
        data[idx].profit += tx.profit;
        data[idx].count += 1;
      });

      return data;
    } else {
      // Group by distinct dates
      const dateMap = new Map<string, { revenue: number; profit: number; count: number }>();
      
      filteredTx.forEach((tx) => {
        const current = dateMap.get(tx.date) || { revenue: 0, profit: 0, count: 0 };
        current.revenue += tx.totalAmount;
        current.profit += tx.profit;
        current.count += 1;
        dateMap.set(tx.date, current);
      });

      const sortedDates = Array.from(dateMap.keys()).sort();
      return sortedDates.map((d) => {
        const val = dateMap.get(d)!;
        const dateObj = new Date(d);
        const shortDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
        return {
          label: shortDate,
          fullDate: d,
          revenue: val.revenue,
          profit: val.profit,
          count: val.count,
        };
      });
    }
  }, [filteredTx, period]);

  const maxTimelineRevenue = Math.max(...timelineData.map((d) => d.revenue), 1000);

  // Peak Hour Insight
  const peakHour = useMemo(() => {
    if (timelineData.length === 0) return '19:00 - 21:00';
    const sorted = [...timelineData].sort((a, b) => b.revenue - a.revenue);
    const prefix = language === 'en' ? 'At ' : 'Pukul ';
    return sorted[0]?.label ? `${prefix}${sorted[0].label}` : '19:00 - 21:00';
  }, [timelineData, language]);

  const handleExportPdf = () => {
    sounds.playBeep();
    setIsGeneratingPdf(true);
    // Give UI a brief moment to render loading state before heavy PDF compilation
    setTimeout(() => {
      try {
        generateReportPdf({
          storeProfile,
          periodLabel,
          totalRevenue,
          totalCost,
          totalProfit,
          profitMarginPct,
          transactionCount,
          averageOrderValue,
          totalUnitsSold,
          peakHour,
          topSellingItems,
          paymentBreakdown,
          transactions: filteredTx,
          language,
        });
        sounds.playSuccess();
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 3500);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  const exportReportCSV = () => {
    sounds.playBeep();
    const rows = [
      ['LAPORAN ANALISIS PENJUALAN ANGKRINGAN'],
      [`Nama Kedai: ${storeProfile.name}`],
      [`Periode: ${periodLabel}`],
      [`Dicetak pada: ${new Date().toLocaleString(language === 'en' ? 'en-US' : 'id-ID')}`],
      [''],
      ['RINGKASAN METRIK'],
      ['Total Omzet (Penjualan Kotor)', totalRevenue],
      ['Total Modal (HPP)', totalCost],
      ['Total Keuntungan Bersih (Laba)', totalProfit],
      ['Margin Keuntungan (%)', `${profitMarginPct}%`],
      ['Jumlah Transaksi', transactionCount],
      ['Rata-rata per Transaksi', averageOrderValue],
      ['Total Produk Terjual (Unit)', totalUnitsSold],
      [''],
      ['MENU TERLARIS (TOP BEST SELLERS)'],
      ['Peringkat', 'Nama Menu', 'Kategori', 'Jumlah Terjual', 'Total Omzet (Rp)'],
      ...topSellingItems.map((item, idx) => [
        idx + 1,
        `"${(language === 'en' && item.nameEn ? item.nameEn : item.name).replace(/"/g, '""')}"`,
        getCategoryLabel(item.category, language),
        `${item.qty} ${item.unit}`,
        item.revenue,
      ]),
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Angkringan_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Top Controls & Period Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="font-extrabold text-slate-100 text-base sm:text-lg">
              {t.reportsTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.reportsSub}
          </p>
        </div>

        {/* Period Selector Dropdown Button */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 shadow-inner hover:border-slate-700 transition-colors">
          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Periode:</span>
          <div className="relative flex items-center">
            <select
              id="period-dropdown-select"
              value={period}
              onChange={(e) => {
                sounds.playBeep();
                setPeriod(e.target.value as ReportPeriod);
              }}
              className="bg-transparent text-xs sm:text-sm font-extrabold text-white focus:outline-none cursor-pointer pr-6 appearance-none [&>option]:bg-slate-900 [&>option]:text-white"
            >
              <option value="today">{t.periodToday}</option>
              <option value="yesterday">{t.periodYesterday}</option>
              <option value="weekly">{t.periodWeekly}</option>
              <option value="monthly">{t.periodMonthly}</option>
              <option value="yearly">{t.periodYearly}</option>
              <option value="custom">{t.periodCustom}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 pointer-events-none absolute right-0" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="export-report-csv-btn"
            onClick={exportReportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.exportCsvBtn}</span>
          </button>

          <button
            type="button"
            id="export-report-pdf-btn"
            disabled={isGeneratingPdf}
            onClick={handleExportPdf}
            className={`px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer ${
              pdfSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-950/40'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{t.generatingPdfNotice}</span>
              </>
            ) : pdfSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{t.pdfSuccessNotice}</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-white" />
                <span>{t.printReportBtn}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Custom Date Range Selector (if period === 'custom') */}
      {period === 'custom' && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t.fromDate}</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t.toDate}</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
            />
          </div>
        </div>
      )}

      {/* Period Active Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold text-slate-300">{t.showingPeriod} <span className="text-sky-400">{periodLabel}</span></span>
        <span>{filteredTx.length} {t.completedTxLogged}</span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Omzet */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.kpiGrossRevenue}</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black text-sky-400 font-mono">
              {formatRupiah(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.kpiNetProfit}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {formatRupiah(totalProfit)}
            </span>
          </div>
        </div>

        {/* Margin % */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.kpiProfitMargin}</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
              {profitMarginPct}%
            </span>
          </div>
        </div>

        {/* Jumlah Transaksi */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.kpiTransactions}</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
              {transactionCount}
            </span>
            <span className="text-xs text-slate-400 ml-1">{t.receiptsCountSuffix}</span>
          </div>
        </div>

        {/* Rata-rata per Transaksi */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.kpiAvgOrder}</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-bold text-slate-200 font-mono">
              {formatRupiah(averageOrderValue)}
            </span>
          </div>
        </div>

        {/* Total Unit Terjual */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.kpiTotalUnits}</span>
            <Award className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
              {formatNumber(totalUnitsSold)}
            </span>
            <span className="text-xs text-slate-400 ml-1">{t.unitPcs}</span>
          </div>
        </div>

      </div>

      {/* Main Charts & Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT: Timeline Trend Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>{t.trendTitle} ({period === 'today' || period === 'yesterday' ? t.trendHourly : t.trendDaily})</span>
              </h3>
              <p className="text-xs text-slate-400">{t.trendSub}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
                <span className="text-slate-300">{t.legendRevenue}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                <span className="text-slate-300">{t.legendProfit}</span>
              </div>
            </div>
          </div>

          {/* Interactive Inspection Banner - Crisp, prominent & zero clipping */}
          {(() => {
            const hoveredItem = hoveredTimelineIndex !== null ? timelineData[hoveredTimelineIndex] : null;
            return (
              <div className="min-h-[50px] transition-all duration-200">
                {hoveredItem ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-950/80 via-slate-950 to-emerald-950/80 border border-sky-500/40 shadow-lg shadow-slate-950/40 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/25 text-sky-300 font-mono text-xs font-black border border-blue-400/30">
                        {hoveredItem.label}
                      </span>
                      <span className="text-xs text-slate-300 font-bold">
                        {hoveredItem.count} {t.receiptsCountSuffix}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block"></span>
                        <span className="text-slate-400 text-[11px] font-sans">{t.legendRevenue}:</span>
                        <strong className="text-sky-300 font-black text-sm">{formatRupiah(hoveredItem.revenue)}</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                        <span className="text-slate-400 text-[11px] font-sans">{t.legendProfit}:</span>
                        <strong className="text-emerald-400 font-black text-sm">{formatRupiah(hoveredItem.profit)}</strong>
                      </div>
                      <div className="hidden sm:flex items-center gap-1">
                        <span className="text-slate-400 text-[11px] font-sans">Margin:</span>
                        <span className="text-amber-400 font-black">
                          {hoveredItem.revenue > 0 ? Math.round((hoveredItem.profit / hoveredItem.revenue) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 px-3.5">
                    <span className="flex items-center gap-2 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping inline-block"></span>
                      <span>{language === 'en' ? 'Hover or tap any bar below to inspect hourly/daily details' : 'Arahkan kursor atau klik batang grafik di bawah untuk melihat rincian omzet & laba'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                      {timelineData.length} {period === 'today' || period === 'yesterday' ? (language === 'en' ? 'time slots' : 'titik jam') : (language === 'en' ? 'days' : 'hari')}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Custom SVG Bar Visualization with unclipped internal tooltip space */}
          <div className="relative h-64 sm:h-72 w-full pt-20 flex items-end gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
            {timelineData.map((d, index) => {
              const isHovered = hoveredTimelineIndex === index;
              const revHeight = Math.max(8, Math.round((d.revenue / maxTimelineRevenue) * 100));
              const profitHeight = Math.max(4, Math.round((d.profit / maxTimelineRevenue) * 100));

              return (
                <div 
                  key={index}
                  onMouseEnter={() => setHoveredTimelineIndex(index)}
                  onMouseLeave={() => setHoveredTimelineIndex(null)}
                  onClick={() => setHoveredTimelineIndex(isHovered ? null : index)}
                  className={`flex-1 min-w-[40px] flex flex-col items-center h-full justify-end relative cursor-pointer rounded-xl transition-all duration-150 p-1 ${
                    isHovered ? 'bg-blue-950/50 ring-1 ring-sky-500/50' : 'hover:bg-slate-800/40'
                  }`}
                >
                  
                  {/* Floating tooltip above bar - positioned safely at top-2 inside the padded container so it's NEVER clipped */}
                  <div 
                    className={`absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center bg-slate-950 text-white text-[10px] px-2.5 py-1.5 rounded-xl border border-sky-500/60 shadow-2xl z-30 whitespace-nowrap pointer-events-none transition-all duration-150 ${
                      isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                  >
                    <span className="font-black text-sky-400 font-mono text-[11px]">{d.label}</span>
                    <span className="font-bold text-slate-100 mt-0.5">{formatRupiah(d.revenue)}</span>
                    <span className="font-bold text-emerald-400">Laba: {formatRupiah(d.profit)}</span>
                    <span className="text-slate-400 text-[9px]">{d.count} {t.receiptsCountSuffix}</span>
                  </div>

                  {/* Bars side by side */}
                  <div className="w-full flex items-end justify-center gap-1 h-36 sm:h-40">
                    <div 
                      style={{ height: `${revHeight}%` }} 
                      className={`w-1/2 bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-md transition-all duration-300 ${
                        isHovered ? 'brightness-125 ring-1 ring-sky-300 shadow-md shadow-sky-500/40' : ''
                      }`}
                    ></div>
                    <div 
                      style={{ height: `${profitHeight}%` }} 
                      className={`w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 ${
                        isHovered ? 'brightness-125 ring-1 ring-emerald-300 shadow-md shadow-emerald-500/40' : ''
                      }`}
                    ></div>
                  </div>

                  {/* Bottom Label */}
                  <div className={`text-[10px] mt-2 text-center truncate w-full font-mono transition-colors ${
                    isHovered ? 'font-black text-sky-400 scale-105' : 'font-bold text-slate-400'
                  }`}>
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Peak hour and insights banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>{t.peakHourLabel} <strong className="text-sky-400">{peakHour}</strong></span>
            </div>
            <div className="text-slate-400 text-[11px]">
              {t.peakHourTip}
            </div>
          </div>
        </div>

        {/* RIGHT: Category Breakdown & Payment Methods (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Category Share */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-100 text-sm flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-sky-400" />
                <span>{t.categoryShareTitle}</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              {categoryBreakdown.map((cat) => (
                <div key={cat.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.label}</span>
                    <span className="font-mono text-sky-400">{formatRupiah(cat.revenue)} ({cat.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-sky-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="font-extrabold text-slate-100 text-sm flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>{t.payMethodDistTitle}</span>
            </h3>

            <div className="space-y-2">
              {paymentBreakdown.map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${m.color}`}></span>
                    <span className="font-bold text-slate-200">{m.method}</span>
                    <span className="text-slate-500 text-[10px]">({m.count}x)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-100">{formatRupiah(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Top 10 Best Sellers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-400" />
            <h3 className="font-extrabold text-slate-100 text-base">
              {t.topBestSellersTitle}
            </h3>
          </div>
          <span className="text-xs text-slate-400">{t.topBestSellersSub}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">{t.menuNameHeader}</th>
                <th className="py-2.5 px-3">{t.categoryHeader}</th>
                <th className="py-2.5 px-3 text-right">{t.qtySoldHeader}</th>
                <th className="py-2.5 px-3 text-right">{t.totalRevenueHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topSellingItems.map((item, index) => {
                const displayName = language === 'en' && item.nameEn ? item.nameEn : item.name;
                return (
                  <tr key={index} className="hover:bg-slate-850/50">
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                          index === 0
                            ? 'bg-blue-600 text-white shadow-sm'
                            : index === 1
                            ? 'bg-slate-700 text-slate-200'
                            : index === 2
                            ? 'bg-slate-800 text-slate-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100 text-sm">
                      {displayName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {getCategoryLabel(item.category, language)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-100 font-mono text-sm">
                      {item.qty} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-sky-400 font-mono text-sm">
                      {formatRupiah(item.revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {topSellingItems.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <Award className="w-10 h-10 mx-auto text-slate-700 opacity-60 mb-2" />
            <p className="font-semibold text-slate-400">{t.noReportData}</p>
          </div>
        )}
      </div>

    </div>
  );
};
