import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/useAuthStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Truck, X, ShieldCheck, CreditCard, Wallet, Sparkles, 
  Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface ShippingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedItems: InventoryItem[];
  walletBalance: number;
  shippedBefore: boolean;
  isProcessing: boolean;
}

type CheckoutStep = 'calculate' | 'details' | 'processing' | 'success';

export default function ShippingCalculatorModal({
  isOpen,
  onClose,
  selectedItems,
  walletBalance,
  shippedBefore,
  onConfirm,
  isProcessing: parentProcessing
}: ShippingCalculatorModalProps) {
  const { profile, refreshProfile } = useAuthStore();
  const { createShippingPaymentIntent, confirmShippingPayment } = useInventoryStore();

  const [step, setStep] = useState<CheckoutStep>('calculate');
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Card details states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('');

  // Payment intent state
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    amount: number;
    requires_card_payment: boolean;
    is_live_stripe: boolean;
    publishableKey?: string;
  } | null>(null);

  // Status updates for processing step
  const [processingStatus, setProcessingStatus] = useState<string>('🔐 Establishing SSL session...');
  const [trackingLabel, setTrackingLabel] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('calculate');
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      setCardZip('');
      setPaymentIntent(null);
      setPaymentError(null);
      setTrackingLabel('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate individual item shipping fee helper
  const calculateIndividualFee = (val: number) => Math.min(Math.max(val * 0.1, 50), 500);

  const totalValue = selectedItems.reduce((sum, item) => sum + (item.item?.value || 0), 0);
  const individualFeesSum = selectedItems.reduce((sum, item) => sum + calculateIndividualFee(item.item?.value || 0), 0);
  
  // Dynamic combined fee formula
  const consolidatedFee = Math.min(Math.max(totalValue * 0.1, 50), 500);
  const discountSaved = Math.max(0, individualFeesSum - consolidatedFee);

  const canAfford = shippedBefore ? walletBalance >= consolidatedFee : true;

  // Detect card type based on number prefix
  const getCardType = (num: string) => {
    const cleanNum = num.replace(/\s+/g, '');
    if (cleanNum.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleanNum)) return 'mastercard';
    if (/^3[47]/.test(cleanNum)) return 'amex';
    return 'generic';
  };

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value.substring(0, 19));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    setCardExpiry(value.substring(0, 5));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardCvc(value.substring(0, 4));
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardZip(value.substring(0, 5));
  };

  // Handle proceed to card payment
  const handleProceedToPayment = async () => {
    if (!profile) return;
    setLoadingIntent(true);
    setPaymentError(null);
    try {
      const itemIds = selectedItems.map(i => i.id);
      const res = await createShippingPaymentIntent(itemIds, profile.id, profile.shipping_address || '');
      setPaymentIntent(res);
      setStep('details');
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initialize card payment session');
      toast.error('Payment initialization failed');
    } finally {
      setLoadingIntent(false);
    }
  };

  // Process Card Checkout Submit
  const handleCardPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !paymentIntent) return;

    // Basic fields validation
    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15) {
      return setPaymentError('Please enter a valid credit card number');
    }
    if (cardExpiry.length < 5) {
      return setPaymentError('Please enter a valid expiration date (MM/YY)');
    }
    if (cardCvc.length < 3) {
      return setPaymentError('Please enter a valid CVV code');
    }
    if (cardZip.length < 5) {
      return setPaymentError('Please enter a valid billing postal ZIP code');
    }

    setSubmittingPayment(true);
    setPaymentError(null);
    setStep('processing');

    try {
      // Step 1: Simulated terminal logging
      setProcessingStatus('🔐 Establishing SSL tunnel to Stripe vault...');
      await new Promise(r => setTimeout(r, 800));

      setProcessingStatus('💳 Tokenizing sensitive card credentials...');
      await new Promise(r => setTimeout(r, 800));

      let paymentId = paymentIntent.clientSecret;

      if (paymentIntent.is_live_stripe && paymentIntent.publishableKey) {
        setProcessingStatus('⚡ Creating secure token via Stripe...');
        const stripe = await loadStripe(paymentIntent.publishableKey);
        if (!stripe) {
          throw new Error('Stripe.js could not be loaded');
        }

        const [exp_month_str, exp_year_str] = cardExpiry.split('/');
        if (!exp_month_str || !exp_year_str) {
          throw new Error('Please enter a valid expiration date (MM/YY)');
        }

        // Tokenize raw card details securely via Stripe API v1
        const formBody = new URLSearchParams();
        formBody.append('card[number]', cleanCard);
        formBody.append('card[cvc]', cardCvc);
        formBody.append('card[exp_month]', exp_month_str.trim());
        formBody.append('card[exp_year]', exp_year_str.trim());
        formBody.append('card[name]', cardName);
        formBody.append('card[address_zip]', cardZip);

        const tokenRes = await fetch('https://api.stripe.com/v1/tokens', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paymentIntent.publishableKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formBody.toString()
        });

        const tokenResult = await tokenRes.json();

        if (!tokenRes.ok || tokenResult.error) {
          throw new Error(tokenResult.error?.message || 'Credit card tokenization failed');
        }

        setProcessingStatus('⚡ Processing routing clearance with live Stripe gateway...');
        const stripeResult = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
          payment_method: {
            card: {
              token: tokenResult.id
            },
            billing_details: {
              name: cardName,
              address: { postal_code: cardZip }
            }
          }
        });

        if (stripeResult.error) {
          throw new Error(stripeResult.error.message || 'Payment clearance failed');
        }
        paymentId = stripeResult.paymentIntent?.id || paymentIntent.clientSecret;
      } else {
        setProcessingStatus('⚡ Verifying secure transaction clearance with Stripe\'s global network...');
        await new Promise(r => setTimeout(r, 1200));
      }

      setProcessingStatus('🏷️ Generating physical home delivery shipping label...');
      const itemIds = selectedItems.map(i => i.id);
      const confirmRes = await confirmShippingPayment(
        itemIds,
        profile.id,
        profile.shipping_address || '',
        paymentId
      );

      // Succeeded!
      setTrackingLabel(confirmRes.shipping_label);
      setProcessingStatus('✅ Shipment created successfully!');
      
      // Refresh local caches
      await refreshProfile();
      
      toast.success('Card payment processed successfully! Shipping label created.');
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || 'Card payment execution failed. Please verify details.');
      setStep('details');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="shipping-calculator-modal">
      <div className="relative max-w-lg w-full rounded-2xl border border-white/10 bg-zinc-950 p-6 flex flex-col space-y-4 shadow-2xl overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute -left-20 -top-20 w-40 h-40 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2.5">
            <Truck className="h-5 w-5 text-orange-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Bulk Shipping Checkout
              </h3>
              <p className="text-[10px] text-white/40 font-mono">
                {step === 'calculate' && "Physical delivery appraisal & logistics fee calculator"}
                {step === 'details' && "Secure cardholder billing authorization"}
                {step === 'processing' && "SSL card gateway authorization portal"}
                {step === 'success' && "Logistic cargo tracking registration complete"}
              </p>
            </div>
          </div>
          {step === 'calculate' && (
            <button 
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* STEP 1: CALCULATE FEES */}
        {step === 'calculate' && (
          <>
            {/* Selected Items List */}
            <div className="space-y-2">
              <span className="block text-[9px] font-mono font-black uppercase text-white/40 tracking-wider">
                Selected Cargo ({selectedItems.length} items)
              </span>
              <div className="max-h-[160px] overflow-y-auto border border-white/5 bg-black/40 rounded-xl divide-y divide-white/5 p-1 pr-2 space-y-1">
                {selectedItems.map(item => {
                  const itemVal = item.item?.value || 0;
                  const itemFee = calculateIndividualFee(itemVal);
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 px-2 text-xs">
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <img 
                          src={item.item?.image_url} 
                          alt={item.item?.name} 
                          className="h-8 w-8 object-contain rounded bg-white/5 border border-white/5 p-0.5 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate min-w-0">
                          <span className="block text-white font-bold truncate">{item.item?.name}</span>
                          <span className="block text-[9px] text-white/40 font-mono">Value: {formatCurrency(itemVal)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block font-mono text-white/40 text-[10px]">Std Fee</span>
                        <span className="block font-mono font-bold text-white">{formatCurrency(itemFee)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Summary Card */}
            <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase font-bold text-[9px] tracking-wider">Combined Cargo Value</span>
                <span className="font-mono font-bold text-white text-sm">{formatCurrency(totalValue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase font-bold text-[9px] tracking-wider">Individual Shipping Sum</span>
                <span className="font-mono text-white/60 line-through">{formatCurrency(individualFeesSum)}</span>
              </div>

              <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                <div className="flex items-center space-x-1.5">
                  <span className="text-orange-500 uppercase font-black text-xs tracking-wider">Consolidated Fee</span>
                  {discountSaved > 0 && (
                    <span className="inline-flex items-center space-x-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 px-1 font-bold">
                      <Sparkles className="h-2 w-2 text-emerald-400" />
                      <span>Bulk Discount</span>
                    </span>
                  )}
                </div>
                <span className="font-mono font-black text-orange-500 text-lg">{formatCurrency(consolidatedFee)}</span>
              </div>

              {discountSaved > 0 && (
                <div className="text-[10px] text-emerald-400 font-mono flex items-center justify-between bg-emerald-500/5 rounded px-2.5 py-1">
                  <span>Estimated shipping consolidation savings:</span>
                  <span className="font-bold">+{formatCurrency(discountSaved)} Saved</span>
                </div>
              )}
            </div>

            {/* Payment Requirements Banner */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex gap-2.5 text-[11px] leading-relaxed text-blue-300">
              {shippedBefore ? (
                <>
                  <Wallet className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[9px] text-blue-400">Deduction via Drop Wallet</p>
                    <p className="opacity-80">
                      Since you have shipped with us before, the consolidated shipping fee of <strong>{formatCurrency(consolidatedFee)}</strong> can be deducted directly from your virtual play balance.
                    </p>
                    <p className="text-[10px] opacity-60">Your current balance: {formatCurrency(walletBalance)}</p>
                  </div>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 text-orange-400 shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[9px] text-orange-400">Card Payment Required (First Shipment)</p>
                    <p className="opacity-80 text-white/85">
                      The first physical home delivery request requires payment by card payment with Stripe billing. After this successful shipment, all future fees can be deducted directly from your wallet balance.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Affordability check for wallet */}
            {shippedBefore && !canAfford && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono text-center">
                Insufficient play balance. Please top up or sell items to pay the {formatCurrency(consolidatedFee)} fee.
              </div>
            )}

            {paymentError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono text-center flex items-center justify-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 py-3 font-sans text-xs font-bold text-white/60 hover:text-white transition-all cursor-pointer text-center"
              >
                DISMISS
              </button>
              
              {shippedBefore ? (
                <button
                  disabled={parentProcessing || !canAfford || selectedItems.length === 0}
                  onClick={onConfirm}
                  className="flex items-center justify-center space-x-1.5 rounded-lg bg-orange-500 text-black font-black uppercase tracking-wider text-xs py-3 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{parentProcessing ? "PROCESSING..." : "CONFIRM SHIPMENT"}</span>
                </button>
              ) : (
                <button
                  disabled={loadingIntent || selectedItems.length === 0}
                  onClick={handleProceedToPayment}
                  className="flex items-center justify-center space-x-1.5 rounded-lg bg-orange-500 text-black font-black uppercase tracking-wider text-xs py-3 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  {loadingIntent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  <span>{loadingIntent ? "INITIALIZING SECURE..." : "PROCEED TO PAYMENT"}</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* STEP 2: STRIPE CREDIT CARD FORM DETAILS */}
        {step === 'details' && (
          <form onSubmit={handleCardPaymentSubmit} className="space-y-4 animate-scale-up">
            <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Consolidated Delivery Fee:</span>
                <span className="text-orange-500 font-mono font-black text-sm">{formatCurrency(consolidatedFee)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-white/30 font-mono">
                <span>Shipping Destination:</span>
                <span className="truncate max-w-[200px] text-white/60">{profile?.shipping_address || "None configured"}</span>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-[11px] leading-relaxed flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Form Inputs */}
            <div className="space-y-3">
              {/* Cardholder Name */}
              <div className="space-y-1">
                <label className="block text-[10px] text-white/50 font-bold uppercase tracking-wide">Cardholder Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Card Number Group */}
              <div className="space-y-1">
                <label className="block text-[10px] text-white/50 font-bold uppercase tracking-wide">Card Number</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 pl-3.5 pr-12 py-2.5 text-xs text-white placeholder-white/20 focus:border-orange-500 focus:outline-none font-mono"
                  />
                  <div className="absolute right-3.5 top-2.5 flex items-center space-x-1">
                    {getCardType(cardNumber) === 'visa' && (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">VISA</span>
                    )}
                    {getCardType(cardNumber) === 'mastercard' && (
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">MC</span>
                    )}
                    {getCardType(cardNumber) === 'amex' && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">AMEX</span>
                    )}
                    {getCardType(cardNumber) === 'generic' && (
                      <CreditCard className="h-4 w-4 text-white/30" />
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 3 column for Expiry, CVC, and ZIP */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 font-bold uppercase tracking-wide">Expiration</label>
                  <input 
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2.5 text-xs text-white placeholder-white/20 focus:border-orange-500 focus:outline-none font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 font-bold uppercase tracking-wide">CVC</label>
                  <input 
                    type="password"
                    required
                    placeholder="•••"
                    value={cardCvc}
                    onChange={handleCvcChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2.5 text-xs text-white placeholder-white/20 focus:border-orange-500 focus:outline-none font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-white/50 font-bold uppercase tracking-wide">Postal ZIP</label>
                  <input 
                    type="text"
                    required
                    placeholder="10001"
                    value={cardZip}
                    onChange={handleZipChange}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2.5 text-xs text-white placeholder-white/20 focus:border-orange-500 focus:outline-none font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Secure Real-Time Stripe Checkout Notice */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex gap-2 text-[10px] leading-relaxed text-emerald-400/90">
              <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block text-emerald-300">Secure Live Stripe Payment Gateways Active</span>
                Your card data is securely tokenized via Stripe's official API endpoints. Complete your checkout securely.
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('calculate')}
                className="flex items-center justify-center space-x-1 text-xs font-bold text-white/60 hover:text-white rounded-lg bg-white/5 border border-white/5 py-3 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>GO BACK</span>
              </button>
              <button
                type="submit"
                className="flex items-center justify-center space-x-1 text-xs font-black uppercase tracking-wider text-black rounded-lg bg-orange-500 hover:bg-orange-400 py-3 transition-all cursor-pointer shadow-lg shadow-orange-500/20 font-sans"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>PAY & SHIP</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: TRANSACTION AUTHORIZATION PROCESSOR */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in text-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-orange-500/20 scale-125 animate-ping"></div>
              <div className="h-14 w-14 rounded-full border border-orange-500/10 flex items-center justify-center bg-orange-500/5">
                <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
              </div>
            </div>
            
            <div className="space-y-1.5 w-full">
              <p className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Authorizing card clearance...
              </p>
              <div className="mx-auto max-w-[280px] p-2 rounded bg-black/60 border border-white/5 text-[9px] font-mono text-orange-400">
                {processingStatus}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CARGO TRACKING LABELS CREATED */}
        {step === 'success' && (
          <div className="flex flex-col space-y-4 animate-scale-up">
            <div className="flex flex-col items-center text-center space-y-2.5 py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 animate-bounce" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Payment Processed Successfully!
                </h4>
                <p className="text-[10px] text-white/40 font-mono">
                  Cargo physical shipping label has been provisioned
                </p>
              </div>
            </div>

            {/* Physical Address Parcel Receipt Card */}
            <div className="rounded-xl border border-white/5 bg-black/50 p-4 space-y-3 font-mono text-[10px]">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-white/40 font-bold">SHIPMENT STATUS</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">PROCESSING DISPATCH</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-white/30">PARCELS COUNT:</span>
                  <span className="text-white font-bold">{selectedItems.length} ITEMS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">LOGISTIC METHOD:</span>
                  <span className="text-white font-bold">USPS PRIORITY MAIL SECURED</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-white/30 shrink-0">SHIPPING DEST:</span>
                  <span className="text-white font-bold text-right truncate max-w-[180px]">{profile?.shipping_address}</span>
                </div>
              </div>

              {/* Tracking Label display */}
              <div className="bg-zinc-900 border border-white/5 rounded-lg p-3 text-center space-y-1">
                <span className="block text-[8px] text-white/30 uppercase tracking-wider">USPS Tracking Number Label:</span>
                <span className="block text-sm font-black text-orange-500 tracking-widest">{trackingLabel}</span>
              </div>
            </div>

            {/* Instruction bullet points */}
            <div className="rounded-lg border border-white/5 bg-white/5 p-3 text-[10px] leading-relaxed text-white/60 space-y-1">
              <p className="font-bold text-white uppercase text-[8px] tracking-wider text-orange-400">Logistic Route Next Steps:</p>
              <ul className="list-disc pl-3.5 space-y-1">
                <li>Your parcel label has been printed and appended to our dispatch bins.</li>
                <li>Fulfillment and packaging operations will finalize within 24 hours.</li>
                <li><strong>All future shipments are fully unlocked for play balance wallet deductions!</strong></li>
              </ul>
            </div>

            {/* Done Action CTA */}
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-orange-500 text-black hover:bg-orange-400 py-3 font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/20"
            >
              CLOSE & REFRESH INVENTORY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
