import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Edit, 
  Trash2, 
  History, 
  Download, 
  X,
  PlusCircle,
  RotateCcw
} from 'lucide-react';
import { MenuItem, Category, StockLog } from '../types';
import { formatRupiah, formatNumber, getCategoryLabel, formatDateTimeIndonesian } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';

export interface InventoryScreenProps {
  menuItems: MenuItem[];
  stockLogs: StockLog[];
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onAdjustStock: (itemId: string, changeAmount: number, reason: 'restock' | 'adjustment' | 'spoilage', notes?: string) => void;
  onResetDefaultMenu: () => void;
}

export const InventoryScreen = ({
  menuItems,
  stockLogs,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onAdjustStock,
  onResetDefaultMenu,
}: InventoryScreenProps) => {
  const { language, t, getUnitName, getReasonLabel } = useLanguage();
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'safe' | 'low' | 'empty'>('all');

  // Add / Edit Modal State
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Quick Restock Modal State
  const [restockItem, setRestockItem] = useState<MenuItem | null>(null);
  const [customRestockQty, setCustomRestockQty] = useState<string>('10');
  const [restockReason, setRestockReason] = useState<'restock' | 'adjustment' | 'spoilage'>('restock');
  const [restockNote, setRestockNote] = useState<string>('');

  // Form fields for Add/Edit
  const [formName, setFormName] = useState<string>('');
  const [formNameEn, setFormNameEn] = useState<string>('');
  const [formCategory, setFormCategory] = useState<Category>('sate');
  const [formPrice, setFormPrice] = useState<number>(3000);
  const [formCostPrice, setFormCostPrice] = useState<number>(1500);
  const [formStock, setFormStock] = useState<number>(20);
  const [formMinThreshold, setFormMinThreshold] = useState<number>(5);
  const [formUnit, setFormUnit] = useState<string>('tusuk');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDescriptionEn, setFormDescriptionEn] = useState<string>('');

  // Summary Metrics
  const totalSKUs = menuItems.length;
  const totalPhysicalStock = menuItems.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = menuItems.filter((i) => i.stock > 0 && i.stock <= i.minStockThreshold).length;
  const outOfStockCount = menuItems.filter((i) => i.stock <= 0).length;
  const totalAssetCost = menuItems.reduce((sum, item) => sum + item.costPrice * item.stock, 0);
  const totalPotentialRevenue = menuItems.reduce((sum, item) => sum + item.price * item.stock, 0);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const itemName = language === 'en' && item.nameEn ? item.nameEn : item.name;
      const itemDesc = language === 'en' && item.descriptionEn ? item.descriptionEn : item.description;

      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (itemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (itemDesc && itemDesc.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesStock = true;
      if (stockStatusFilter === 'empty') matchesStock = item.stock <= 0;
      else if (stockStatusFilter === 'low') matchesStock = item.stock > 0 && item.stock <= item.minStockThreshold;
      else if (stockStatusFilter === 'safe') matchesStock = item.stock > item.minStockThreshold;

      return matchesCategory && matchesSearch && matchesStock;
    });
  }, [menuItems, selectedCategory, searchQuery, stockStatusFilter, language]);

  const openAddItemModal = () => {
    sounds.playBeep();
    setEditingItem(null);
    setFormName('');
    setFormNameEn('');
    setFormCategory('sate');
    setFormPrice(3000);
    setFormCostPrice(1500);
    setFormStock(25);
    setFormMinThreshold(5);
    setFormUnit('tusuk');
    setFormDescription('');
    setFormDescriptionEn('');
    setShowItemModal(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    sounds.playBeep();
    setEditingItem(item);
    setFormName(item.name);
    setFormNameEn(item.nameEn || '');
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormCostPrice(item.costPrice);
    setFormStock(item.stock);
    setFormMinThreshold(item.minStockThreshold);
    setFormUnit(item.unit);
    setFormDescription(item.description || '');
    setFormDescriptionEn(item.descriptionEn || '');
    setShowItemModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    sounds.playBeep();

    if (editingItem) {
      const updated: MenuItem = {
        ...editingItem,
        name: formName.trim(),
        nameEn: formNameEn.trim() || undefined,
        category: formCategory,
        price: Number(formPrice),
        costPrice: Number(formCostPrice),
        stock: Number(formStock),
        minStockThreshold: Number(formMinThreshold),
        unit: formUnit.trim() || 'pcs',
        description: formDescription.trim() || undefined,
        descriptionEn: formDescriptionEn.trim() || undefined,
        isAvailable: Number(formStock) > 0,
      };
      onUpdateMenuItem(updated);
    } else {
      const newItem: MenuItem = {
        id: `menu-${Date.now()}`,
        name: formName.trim(),
        nameEn: formNameEn.trim() || undefined,
        category: formCategory,
        price: Number(formPrice),
        costPrice: Number(formCostPrice),
        stock: Number(formStock),
        minStockThreshold: Number(formMinThreshold),
        unit: formUnit.trim() || 'pcs',
        description: formDescription.trim() || undefined,
        descriptionEn: formDescriptionEn.trim() || undefined,
        isAvailable: Number(formStock) > 0,
      };
      onAddMenuItem(newItem);
    }

    setShowItemModal(false);
  };

  const handleQuickRestock = (item: MenuItem, amount: number) => {
    sounds.playBeep();
    onAdjustStock(item.id, amount, 'restock', `Quick restock +${amount} ${item.unit}`);
  };

  const handleApplyCustomRestock = () => {
    if (!restockItem) return;
    const qty = Number(customRestockQty);
    if (isNaN(qty) || qty === 0) return;

    sounds.playBeep();
    onAdjustStock(restockItem.id, qty, restockReason, restockNote.trim() || undefined);
    setRestockItem(null);
    setCustomRestockQty('10');
    setRestockNote('');
  };

  const exportStockCSV = () => {
    sounds.playBeep();
    const headers = ['ID', 'Nama Menu (ID)', 'Menu Name (EN)', 'Kategori', 'Harga Jual (Rp)', 'Harga Modal (Rp)', 'Margin (Rp)', 'Stok Saat Ini', 'Batas Minimum', 'Satuan'];
    const rows = menuItems.map((i) => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${(i.nameEn || '').replace(/"/g, '""')}"`,
      i.category,
      i.price,
      i.costPrice,
      i.price - i.costPrice,
      i.stock,
      i.minStockThreshold,
      i.unit,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Stok_Angkringan_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.totalSKUs}</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
              {totalSKUs}
            </span>
            <span className="text-xs text-slate-400 ml-1">Menu</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.totalPhysicalStock}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {formatNumber(totalPhysicalStock)}
            </span>
            <span className="text-xs text-slate-400 ml-1">Pcs/Tusuk</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.stockLowOrEmpty}</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount + outOfStockCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-red-400 font-mono">
              {lowStockCount + outOfStockCount}
            </span>
            <span className="text-[11px] text-slate-400">
              ({outOfStockCount} {t.emptyCount})
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.costValuation}</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm sm:text-base font-extrabold text-slate-200 font-mono">
              {formatRupiah(totalAssetCost)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1528] to-[#132035] border border-blue-950/80 shadow-md shadow-slate-950/25 flex flex-col justify-between col-span-2 sm:col-span-1 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t.potentialRevenue}</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm sm:text-base font-extrabold text-sky-400 font-mono">
              {formatRupiah(totalPotentialRevenue)}
            </span>
          </div>
        </div>

      </div>

      {/* Navigation Header between Inventory and Stock History Logs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-md shadow-slate-950/20">
        
        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => {
              sounds.playBeep();
              setActiveTab('inventory');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{t.tabMenuStock}</span>
          </button>

          <button
            onClick={() => {
              sounds.playBeep();
              setActiveTab('logs');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{t.tabStockLogs} ({stockLogs.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportStockCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.downloadCSV}</span>
          </button>

          <button
            onClick={openAddItemModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-blue-950/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewMenuBtn}</span>
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        /* INVENTORY LIST VIEW */
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchMenuPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Select & Stock Status Select */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Category | 'all')}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">{t.allCategories}</option>
                <option value="nasi">{t.catNasi}</option>
                <option value="sate">{t.catSate}</option>
                <option value="gorengan">{t.catGorengan}</option>
                <option value="minuman">{t.catMinuman}</option>
                <option value="camilan">{t.catCamilan}</option>
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as 'all' | 'safe' | 'low' | 'empty')}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">{t.allStockStatus}</option>
                <option value="safe">{t.statusSafe}</option>
                <option value="low">{t.statusLow}</option>
                <option value="empty">{t.statusEmpty}</option>
              </select>
            </div>
          </div>

          {/* Table / Card List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{t.thMenuCategory}</th>
                    <th className="py-3 px-3">{t.thSellingPrice}</th>
                    <th className="py-3 px-3">{t.thCostPrice}</th>
                    <th className="py-3 px-3">{t.thProfitMargin}</th>
                    <th className="py-3 px-3">{t.thRealtimeStock}</th>
                    <th className="py-3 px-4 text-center">{t.thQuickAdd}</th>
                    <th className="py-3 px-4 text-right">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const margin = item.price - item.costPrice;
                    const marginPct = Math.round((margin / item.price) * 100);
                    const isOutOfStock = item.stock <= 0;
                    const isLowStock = item.stock > 0 && item.stock <= item.minStockThreshold;
                    const displayName = language === 'en' && item.nameEn ? item.nameEn : item.name;
                    const displayUnit = getUnitName(item.unit);

                    return (
                      <tr key={item.id} className="hover:bg-slate-850/60 transition-colors">
                        
                        {/* Name & Category */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{displayName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                {getCategoryLabel(item.category, language)} • {displayUnit}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 font-bold text-sky-400 font-mono">
                          {formatRupiah(item.price)}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {formatRupiah(item.costPrice)}
                        </td>

                        {/* Margin */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-emerald-400 font-mono">
                            {formatRupiah(margin)}
                          </div>
                          <span className="text-[10px] text-slate-400">({marginPct}%)</span>
                        </td>

                        {/* Stock Counter */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-bold font-mono text-xs border ${
                                isOutOfStock
                                  ? 'bg-red-950/60 text-red-400 border-red-800/60'
                                  : isLowStock
                                  ? 'bg-amber-950/60 text-amber-400 border-amber-800/60 animate-pulse'
                                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                              }`}
                            >
                              {item.stock} {displayUnit}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (min {item.minStockThreshold})
                            </span>
                          </div>
                        </td>

                        {/* Quick Restock Action Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(item, 5)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(item, 10)}
                              className="px-2 py-1 bg-slate-800 hover:bg-blue-900/60 text-sky-300 rounded text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(item, 25)}
                              className="px-2 py-1 bg-slate-800 hover:bg-emerald-900/60 text-emerald-400 rounded text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                            >
                              +25
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playBeep();
                                setRestockItem(item);
                              }}
                              className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-sky-300 rounded text-[11px] font-bold border border-blue-500/30 transition-colors cursor-pointer"
                              title={t.customRestock}
                            >
                              {t.customRestock}
                            </button>
                          </div>
                        </td>

                        {/* Action Buttons: Edit, Delete */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditItemModal(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title={t.editMenuTitle}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                sounds.playBeep();
                                setItemToDelete(item);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title={t.deleteMenuTitle}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Package className="w-10 h-10 mx-auto text-slate-700 opacity-60 mb-2" />
                <p className="font-semibold text-slate-400">{t.noMatchingMenuCriteria}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STOCK MUTATION LOGS VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md space-y-3 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <span>{t.stockMutationLogTitle}</span>
            </h3>
            <span className="text-xs text-slate-400">{t.showingLogsCount} {stockLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">{t.logThTime}</th>
                  <th className="py-2.5 px-3">{t.logThItemName}</th>
                  <th className="py-2.5 px-3">{t.logThChange}</th>
                  <th className="py-2.5 px-3">{t.logThStockBeforeAfter}</th>
                  <th className="py-2.5 px-3">{t.logThReason}</th>
                  <th className="py-2.5 px-3">{t.logThNotes}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockLogs.slice(0, 100).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {formatDateTimeIndonesian(log.timestamp, language)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">
                      {log.itemName}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {log.changeAmount > 0 ? (
                        <span className="text-emerald-400">+{log.changeAmount}</span>
                      ) : (
                        <span className="text-orange-400">{log.changeAmount}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {log.previousStock} → <span className="font-bold text-slate-200">{log.newStock}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.reason === 'sale'
                            ? 'bg-blue-950 text-sky-300 border border-blue-800/40'
                            : log.reason === 'restock'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {getReasonLabel(log.reason)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT MENU ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-950/80 bg-[#0B1528]">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  {editingItem ? t.editMenuModalTitle : t.addMenuModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-200">
              
              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.formItemName} *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="cth: Sate Kulit Ayam Pedas / Wedang Jahe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.formItemNameEn}</label>
                <input
                  type="text"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="e.g. Spicy Chicken Skin Skewer / Ginger Tea"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{t.formCategory} *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="nasi">{t.catNasi}</option>
                    <option value="sate">{t.catSate}</option>
                    <option value="gorengan">{t.catGorengan}</option>
                    <option value="minuman">{t.catMinuman}</option>
                    <option value="camilan">{t.catCamilan}</option>
                    <option value="lainnya">{t.catLainnya}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{t.formUnit} *</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="tusuk / skewer / bungkus / pcs / cup"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{t.formSellingPrice} *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sky-400 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{t.formCostPrice} *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{t.formInitialStock} *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">{t.formMinThreshold}</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.formDescription}</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="cth: Bumbu bacem manis gurih khas angkringan..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.formDescriptionEn}</label>
                <textarea
                  rows={2}
                  value={formDescriptionEn}
                  onChange={(e) => setFormDescriptionEn(e.target.value)}
                  placeholder="e.g. Sweet savory marinated skewer..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-950/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {editingItem ? t.saveChangesBtn : t.addMenuBtnModal}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CUSTOM RESTOCK MODAL */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-950/80 bg-[#0B1528]">
              <h3 className="font-bold text-slate-100 text-sm">
                {t.customRestockTitle}: <span className="text-sky-400">{language === 'en' && restockItem.nameEn ? restockItem.nameEn : restockItem.name}</span>
              </h3>
              <button
                onClick={() => setRestockItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-200">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">{t.currentStock}:</span>
                <span className="font-bold text-base font-mono text-emerald-400">
                  {restockItem.stock} {getUnitName(restockItem.unit)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.stockChangeAmount} *</label>
                <input
                  type="number"
                  value={customRestockQty}
                  onChange={(e) => setCustomRestockQty(e.target.value)}
                  placeholder="cth: 20 / -5"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base font-bold font-mono text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.reasonAdjustment}</label>
                <select
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value as 'restock' | 'adjustment' | 'spoilage')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="restock">{t.reasonRestock}</option>
                  <option value="adjustment">{t.reasonAdjustmentOpt}</option>
                  <option value="spoilage">{t.reasonSpoilage}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{t.formNotes}</label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="cth: Masakan fresh sore ini"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomRestock}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-950/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {t.saveStockBtn}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                  {t.deleteMenuTitle}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'en' && itemToDelete.nameEn ? itemToDelete.nameEn : itemToDelete.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              {t.confirmDeleteItem} &quot;{language === 'en' && itemToDelete.nameEn ? itemToDelete.nameEn : itemToDelete.name}&quot;?
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setItemToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="confirm-delete-menu-item-btn"
                onClick={() => {
                  sounds.playBeep();
                  onDeleteMenuItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Yes, Delete' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
