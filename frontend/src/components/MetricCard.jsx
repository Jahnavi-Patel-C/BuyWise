import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, badge, highlight, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-charcoal-200/70 shadow-card transition-all duration-200 hover:shadow-elevated ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium tracking-wide uppercase text-charcoal-500">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-lavender-50 text-lavender-600 border border-lavender-100">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-charcoal-900">
          {value}
        </h3>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className={`mt-1.5 text-xs ${highlight ? 'text-sage-600 font-medium' : 'text-charcoal-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

