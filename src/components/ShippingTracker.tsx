import React from 'react';
import { Truck, Package, CheckCircle } from 'lucide-react';

interface ShippingTrackerProps {
  status: 'processing' | 'in_transit' | 'delivered';
}

export default function ShippingTracker({ status }: ShippingTrackerProps) {
  const steps = [
    { id: 'processing', label: 'Processing', icon: Package },
    { id: 'in_transit', label: 'In Transit', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === status);

  return (
    <div className="flex items-center justify-between mt-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index <= currentStepIndex;
        return (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className={`p-2 rounded-full ${isActive ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-white/20'}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className={`text-[9px] mt-1 font-bold ${isActive ? 'text-white' : 'text-white/30'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
