import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  UtensilsCrossed, 
  AlertTriangle,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { MenuItem, CartItem, Category, StoreProfile, Transaction, OrderType, UserAccount } from '../types';
import { formatRupiah, getCategoryLabel } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { PaymentModal } from './PaymentModal';
import { useLanguage } from '../i18n/LanguageContext';

export interface POSScreenProps {
  menuItems: MenuItem[];
  storeProfile: StoreProfile;
  currentUser?: UserAccount;
  onCompleteTransaction: (tx: Transaction) => void;
}

export const POSScreen = ({
  menuItems,
  storeProfile,
  currentUser,
  onCompleteTransaction,
}: POSScreenProps) => {
  const { language, t, getUnitName } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState<string>('Meja 1');
  const [customerName, setCustomerName] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [activeItemNoteId, setActiveItemNoteId] = useState<string | null>(null);

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
        
      const matchesAvailability = !onlyAvailable || item.stock > 0;
      return matchesCategory && matchesSearch && matchesAvailability;
    });
  }, [menuItems, selectedCategory, searchQuery, onlyAvailable, language]);

  // Cart summary calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.menuItem.costPrice * item.quantity, 0);
  const estimatedProfit = subtotal - totalCost;

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      sounds.playBeep();
      return;
    }

    sounds.playBeep();
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (ci) => ci.menuItem.id === item.id
      );

      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        const newQty = existing.quantity + 1;
        // Don't exceed available stock
        if (newQty > item.stock) return prevCart;

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: existing.unitPrice * newQty,
        };
        return updated;
      } else {
        const newCartItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          menuItem: item,
          quantity: 1,
          unitPrice: item.price,
          subtotal: item.price,
        };
        return [...prevCart, newCartItem];
      }
    });
  };

  // Adjust cart item quantity
  const updateQuantity = (cartItemId: string, change: number) => {
    sounds.playBeep();
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + change;
            if (newQty <= 0) return null;
            if (newQty > item.menuItem.stock) return item; // Stock limit
            return {
              ...item,
              quantity: newQty,
              subtotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Update note for cart item
  const updateItemNote = (cartItemId: string, noteText: string) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === cartItemId ? { ...item, note: noteText } : item))
    );
  };

  // Remove specific item from cart
  const removeCartItem = (cartItemId: string) => {
    sounds.playBeep();
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length === 0) return;
    sounds.playBeep();
    setShowClearConfirm(true);
  };

  const confirmClearCart = () => {
    sounds.playBeep();
    setCart([]);
    setShowClearConfirm(false);
  };

  const handleFinishTransaction = (tx: Transaction) => {
    onCompleteTransaction(tx);
    setCart([]);
    setShowPaymentModal(false);
  };

  const categories: Array<{ id: Category | 'all'; label: string; icon: string }> = [
    { id: 'all', label: t.allMenu, icon: '🍽️' },
    { id: 'nasi', label: t.catNasi, icon: '🍚' },
    { id: 'sate', label: t.catSate, icon: '🍢' },
    { id: 'gorengan', label: t.catGorengan, icon: '🥟' },
    { id: 'minuman', label: t.catMinuman, icon: '☕' },
    { id: 'camilan', label: t.catCamilan, icon: '🥜' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Menu Selection (8 Cols on Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          
          {/* Top Search & Filter Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              
              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="pos-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchMenuPlaceholder}
                  className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={() => setOnlyAvailable(!onlyAvailable)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    onlyAvailable
                      ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {onlyAvailable ? t.filterInStockOnly : t.filterAllStock}
                </button>
                <div className="text-xs text-slate-500 font-semibold">
                  {filteredItems.length} {t.menuCountSuffix}
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const count = cat.id === 'all' ? menuItems.length : menuItems.filter(i => i.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    id={`cat-btn-${cat.id}`}
                    onClick={() => {
                      sounds.playBeep();
                      setSelectedCategory(cat.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-blue-900/30'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-indigo-950 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredItems.map((item) => {
              const isOutOfStock = item.stock <= 0;
              const isLowStock = item.stock > 0 && item.stock <= item.minStockThreshold;
              const inCartCount = cart
                .filter((ci) => ci.menuItem.id === item.id)
                .reduce((sum, ci) => sum + ci.quantity, 0);

              const displayName = language === 'en' && item.nameEn ? item.nameEn : item.name;
              const displayDesc = language === 'en' && item.descriptionEn ? item.descriptionEn : item.description;
              const displayUnit = getUnitName(item.unit);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-3 border flex flex-col justify-between transition-all duration-200 relative overflow-hidden group ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-50/70 opacity-60 shadow-none'
                      : inCartCount > 0
                      ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-blue-50/20 shadow-md shadow-indigo-500/10'
                      : 'border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5'
                  }`}
                >
                  {/* In-cart count badge */}
                  {inCartCount > 0 && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shadow-md shadow-indigo-950">
                      {inCartCount}
                    </div>
                  )}

                  {/* Top Item Info */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                        {getCategoryLabel(item.category, language)}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                      {displayName}
                    </h4>

                    {displayDesc && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {displayDesc}
                      </p>
                    )}
                  </div>

                  {/* Pricing & Stock Stats */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs sm:text-sm font-black text-indigo-600 font-mono">
                        {formatRupiah(item.price)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">/{displayUnit}</span>
                    </div>

                    {/* Stock status pill */}
                    <div className="flex items-center justify-between text-[10px]">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {t.outOfStock}
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {t.remainingStock} {item.stock}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {t.stockCount} {item.stock}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(item)}
                        className={`w-full py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold shadow-sm shadow-blue-900/25'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addBtn}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-1.5 shadow-xs">
              <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">{t.noMatchingMenu}</p>
              <p className="text-xs text-slate-400">{t.noMatchingMenuSub}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Real-time Cart Panel (4-5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-300/50 flex flex-col lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] overflow-hidden">
            
            {/* Cart Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-indigo-600 border border-blue-500/20 shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{t.cartTitle}</h3>
                  <p className="text-[11px] text-slate-500">{totalItemsCount} {t.itemsInCart}</p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  title={t.clearCartTooltip}
                  className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Customer & Location Presets */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-xs space-y-1.5">
              <div className="flex gap-1.5">
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-blue-500 text-xs"
                >
                  <option value="dine_in">{t.dineIn}</option>
                  <option value="takeaway">{t.takeaway}</option>
                </select>

                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder={t.tableNumberPlaceholder}
                  className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t.customerNamePlaceholder}
                className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            {/* Cart Items List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-1.5">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-200" />
                  <p className="font-bold text-slate-600 text-xs">{t.cartEmptyTitle}</p>
                  <p className="text-[11px] text-slate-400">{t.cartEmptySub}</p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemName = language === 'en' && item.menuItem.nameEn ? item.menuItem.nameEn : item.menuItem.name;
                  return (
                    <div key={item.id} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 leading-tight">
                              {itemName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            @{formatRupiah(item.unitPrice)}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </div>
                      </div>

                      {/* Controls: +/- and Notes */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveItemNoteId(activeItemNoteId === item.id ? null : item.id)}
                            className={`p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-[11px] ${
                              item.note ? 'text-blue-600 font-bold' : ''
                            }`}
                            title={t.addNoteTooltip}
                          >
                            <FileText className="w-3 h-3" />
                            {item.note && <span className="text-[10px] text-blue-600 truncate max-w-[120px]">{item.note}</span>}
                          </button>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          >
                            {item.quantity === 1 ? <Trash2 className="w-2.5 h-2.5 text-red-500" /> : <Minus className="w-2.5 h-2.5" />}
                          </button>
                          <span className="w-6 text-center font-black text-xs text-slate-900 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.menuItem.stock}
                            onClick={() => updateQuantity(item.id, 1)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all shadow-xs ${
                              item.quantity >= item.menuItem.stock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold cursor-pointer'
                            }`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.id)}
                            className="p-0.5 text-slate-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inline note edit */}
                      {(activeItemNoteId === item.id || item.note) && (
                        <div className="pt-0.5">
                          <input
                            type="text"
                            value={item.note || ''}
                            onChange={(e) => updateItemNote(item.id, e.target.value)}
                            placeholder={t.notePlaceholder}
                            className="w-full px-2 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Bottom Summary & Checkout Button */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{t.totalItems} {totalItemsCount}</span>
                  <span className="font-bold text-slate-900">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {t.estProfitMargin}
                  </span>
                  <span>{formatRupiah(estimatedProfit)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{t.totalBill}</span>
                <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              <button
                type="button"
                id="pos-pay-button"
                disabled={cart.length === 0}
                onClick={() => {
                  sounds.playBeep();
                  setShowPaymentModal(true);
                }}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  cart.length > 0
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black active:scale-[0.98] shadow-lg shadow-blue-900/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <span>{t.processPaymentBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Payment Processing Modal */}
      {showPaymentModal && (
        <PaymentModal
          cart={cart}
          subtotal={subtotal}
          storeProfile={storeProfile}
          orderType={orderType}
          tableNumber={tableNumber}
          customerName={customerName}
          currentUser={currentUser}
          onClose={() => setShowPaymentModal(false)}
          onCompleteTransaction={handleFinishTransaction}
        />
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                  {language === 'en' ? 'Clear Shopping Cart?' : 'Kosongkan Keranjang?'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {cart.length} {t.itemsInCart}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {t.confirmClearCart}
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-300"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="confirm-clear-cart-btn"
                onClick={confirmClearCart}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Yes, Clear Cart' : 'Ya, Kosongkan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
