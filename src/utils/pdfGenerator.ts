import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StoreProfile, Transaction, PaymentMethod } from '../types';
import { formatRupiah, formatDateTimeIndonesian } from './formatters';

export interface ReportPdfData {
  storeProfile: StoreProfile;
  periodLabel: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMarginPct: number;
  transactionCount: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  peakHour: string;
  topSellingItems: Array<{
    name: string;
    nameEn?: string;
    category: string;
    qty: number;
    unit: string;
    revenue: number;
  }>;
  paymentBreakdown: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  transactions: Transaction[];
  language: 'id' | 'en';
}

export function generateReportPdf(data: ReportPdfData): void {
  const {
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
    language,
  } = data;

  const isEn = language === 'en';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Header Banner (Dark Navy)
  doc.setFillColor(11, 21, 40); // #0B1528
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Store Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(storeProfile.name.toUpperCase(), 14, 12);

  // Subtitle / Tagline & Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 210, 240);
  const subtitle = `${storeProfile.tagline || 'Kuliner Nusantara & Angkringan'} • ${storeProfile.address || 'Yogyakarta'} • Telp: ${storeProfile.phone || '-'}`;
  doc.text(subtitle, 14, 18);

  // Document Badge on Top Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248); // Sky blue
  const docTypeLabel = isEn ? 'FINANCIAL & SALES REPORT' : 'LAPORAN PENJUALAN & LABA';
  doc.text(docTypeLabel, pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 215, 235);
  const printTimeStr = `${isEn ? 'Printed' : 'Dicetak'}: ${new Date().toLocaleString(isEn ? 'en-US' : 'id-ID')}`;
  doc.text(printTimeStr, pageWidth - 14, 20, { align: 'right' });

  let curY = 38;

  // 2. Report Overview Bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, curY, pageWidth - 28, 14, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, curY, pageWidth - 28, 14, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`${isEn ? 'Report Period' : 'Periode Laporan'}: ${periodLabel}`, 18, curY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${isEn ? 'Status' : 'Status'}: ${isEn ? 'Verified Completed Transactions' : 'Transaksi Selesai Terverifikasi'}`, pageWidth - 18, curY + 9, { align: 'right' });

  curY += 20;

  // 3. Financial Summary Cards (2 rows of 3 columns)
  const cardWidth = (pageWidth - 28 - 8) / 3;
  const cardHeight = 16;

  const metricsRow1 = [
    {
      title: isEn ? 'Gross Revenue (Omzet)' : 'Total Omzet Penjualan',
      value: formatRupiah(totalRevenue),
      color: [14, 116, 144], // Cyan/Blue
    },
    {
      title: isEn ? 'Cost of Goods (HPP)' : 'Total Modal Bahan (HPP)',
      value: formatRupiah(totalCost),
      color: [100, 116, 139], // Slate
    },
    {
      title: isEn ? 'Net Profit (Laba Bersih)' : 'Keuntungan Bersih (Laba)',
      value: formatRupiah(totalProfit),
      color: [16, 149, 108], // Emerald
    },
  ];

  metricsRow1.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 4);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, curY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, curY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    // Accent line
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.rect(x, curY, 2, cardHeight, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.title, x + 5, curY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, x + 5, curY + 12);
  });

  curY += cardHeight + 4;

  const metricsRow2 = [
    {
      title: isEn ? 'Profit Margin' : 'Margin Keuntungan',
      value: `${profitMarginPct}%`,
      sub: isEn ? 'Ratio against revenue' : 'Rasio laba dari omzet',
    },
    {
      title: isEn ? 'Transactions / AOV' : 'Transaksi / Rata-rata',
      value: `${transactionCount} struk • ${formatRupiah(averageOrderValue)}`,
      sub: isEn ? `${totalUnitsSold} total items sold` : `${totalUnitsSold} total porsi terjual`,
    },
    {
      title: isEn ? 'Peak Sales Hour' : 'Jam Tersibuk (Peak)',
      value: peakHour,
      sub: isEn ? 'Optimal customer traffic' : 'Waktu paling ramai pembeli',
    },
  ];

  metricsRow2.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 4);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, curY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, curY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.title, x + 4, curY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(m.value, x + 4, curY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(m.sub, x + 4, curY + 14);
  });

  curY += cardHeight + 6;

  // 4. Payment Methods Breakdown (Mini table)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(isEn ? 'Payment Methods Summary' : 'Ringkasan Cara Bayar', 14, curY);

  curY += 2;

  const paymentRows = paymentBreakdown.map((p) => [
    p.method,
    `${p.count} ${isEn ? 'receipts' : 'struk'}`,
    formatRupiah(p.amount),
    `${totalRevenue > 0 ? ((p.amount / totalRevenue) * 100).toFixed(1) : 0}%`,
  ]);

  autoTable(doc, {
    startY: curY,
    head: [[
      isEn ? 'Method' : 'Metode',
      isEn ? 'Receipts Count' : 'Jumlah Struk',
      isEn ? 'Total Collected' : 'Total Masuk',
      isEn ? 'Share (%)' : 'Porsi (%)',
    ]],
    body: paymentRows,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 50, halign: 'right' },
      3: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Get autoTable final Y
  const lastTableDoc = doc as unknown as { lastAutoTable?: { finalY: number } };
  curY = (lastTableDoc.lastAutoTable?.finalY || curY) + 6;

  // 5. Top Selling Products Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(isEn ? 'Top Best Selling Menu Items' : 'Daftar Menu Terlaris (Best Sellers)', 14, curY);

  curY += 2;

  const topItemsRows = topSellingItems.slice(0, 15).map((item, idx) => {
    const itemName = isEn && item.nameEn ? item.nameEn : item.name;
    const catFormatted = item.category.replace('_', ' ').toUpperCase();
    return [
      `#${idx + 1}`,
      itemName,
      catFormatted,
      `${item.qty} ${item.unit}`,
      formatRupiah(item.revenue),
    ];
  });

  autoTable(doc, {
    startY: curY,
    head: [[
      'No',
      isEn ? 'Menu Item' : 'Nama Menu',
      isEn ? 'Category' : 'Kategori',
      isEn ? 'Sold Qty' : 'Terjual',
      isEn ? 'Total Revenue' : 'Omzet (Rp)',
    ]],
    body: topItemsRows,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [11, 21, 40],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25, halign: 'center' },
      4: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (dataHook) => {
      // Page footer
      const totalPages = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${storeProfile.name} • ${isEn ? 'Page' : 'Halaman'} ${dataHook.pageNumber} / ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    },
  });

  // Save the PDF file to user device
  const dateStr = new Date().toISOString().split('T')[0];
  const cleanName = storeProfile.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_${cleanName}_${dateStr}.pdf`;
  doc.save(filename);
}

export function generateReceiptPdf(transaction: Transaction, storeProfile: StoreProfile, language: 'id' | 'en'): void {
  const isEn = language === 'en';
  // Small thermal paper receipt format: 80mm width x 160mm height (custom receipt size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 180],
  });

  const pw = 80;
  let y = 10;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(storeProfile.name.toUpperCase(), pw / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  if (storeProfile.tagline) {
    doc.text(storeProfile.tagline, pw / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (storeProfile.address) {
    doc.text(storeProfile.address, pw / 2, y, { align: 'center' });
    y += 3.5;
  }
  if (storeProfile.phone) {
    doc.text(`Telp/WA: ${storeProfile.phone}`, pw / 2, y, { align: 'center' });
    y += 4;
  }

  // Divider
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(180, 180, 180);
  doc.line(6, y, pw - 6, y);
  y += 4;

  // Transaction Meta
  doc.setFontSize(7);
  doc.text(`No: ${transaction.receiptNumber}`, 6, y);
  doc.text(formatDateTimeIndonesian(transaction.timestamp, language), pw - 6, y, { align: 'right' });
  y += 3.5;

  doc.text(`Kasir: ${transaction.cashierName}`, 6, y);
  const tableOrType = transaction.tableNumber || (transaction.orderType === 'dine_in' ? 'Dine In' : 'Takeaway');
  doc.text(`Meja: ${tableOrType}`, pw - 6, y, { align: 'right' });
  y += 4;

  doc.line(6, y, pw - 6, y);
  y += 4;

  // Items
  doc.setFont('helvetica', 'bold');
  doc.text(isEn ? 'ITEM' : 'MENU', 6, y);
  doc.text(isEn ? 'TOTAL' : 'JUMLAH', pw - 6, y, { align: 'right' });
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  transaction.items.forEach((item) => {
    const itemName = isEn && item.menuItem.nameEn ? item.menuItem.nameEn : item.menuItem.name;
    doc.text(itemName, 6, y);
    y += 3;
    const detail = `${item.quantity} x ${formatRupiah(item.unitPrice)}`;
    doc.text(detail, 6, y);
    doc.text(formatRupiah(item.subtotal), pw - 6, y, { align: 'right' });
    y += 3.5;
  });

  doc.line(6, y, pw - 6, y);
  y += 4;

  // Totals
  doc.text('Subtotal:', 6, y);
  doc.text(formatRupiah(transaction.subtotal), pw - 6, y, { align: 'right' });
  y += 3.5;

  if (transaction.discount > 0) {
    doc.text('Diskon:', 6, y);
    doc.text(`-${formatRupiah(transaction.discount)}`, pw - 6, y, { align: 'right' });
    y += 3.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL:', 6, y);
  doc.text(formatRupiah(transaction.totalAmount), pw - 6, y, { align: 'right' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const payLabel = transaction.paymentMethod === 'cash' ? 'TUNAI' : transaction.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER';
  doc.text(`Bayar (${payLabel}):`, 6, y);
  doc.text(formatRupiah(transaction.cashReceived || transaction.totalAmount), pw - 6, y, { align: 'right' });
  y += 3.5;

  if (transaction.paymentMethod === 'cash' && transaction.cashChange !== undefined) {
    doc.text('Kembali:', 6, y);
    doc.text(formatRupiah(transaction.cashChange), pw - 6, y, { align: 'right' });
    y += 4.5;
  }

  doc.line(6, y, pw - 6, y);
  y += 5;

  // Footer message
  doc.setFontSize(7);
  doc.text(storeProfile.footerMessage || 'Matur Nuwun Sampun Mampir!', pw / 2, y, { align: 'center' });
  y += 3.5;
  doc.text(isEn ? 'Valid payment receipt' : 'Bukti pembayaran yang sah', pw / 2, y, { align: 'center' });

  doc.save(`Struk_${transaction.receiptNumber}.pdf`);
}
