import React, { useState, useEffect } from 'react';
import { Globe, Clock } from 'lucide-react';

export const MarketSessions: React.FC = () => {
  const [utcTime, setUtcTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hoursUTC = utcTime.getUTCHours();

  const sessions = [
    { name: 'London', hours: '08:00 - 17:00 UTC', isOpen: hoursUTC >= 8 && hoursUTC < 17 },
    { name: 'New York', hours: '13:00 - 22:00 UTC', isOpen: hoursUTC >= 13 && hoursUTC < 22 },
    { name: 'Tokyo', hours: '00:00 - 09:00 UTC', isOpen: hoursUTC >= 0 && hoursUTC < 9 },
    { name: 'Sydney', hours: '22:00 - 07:00 UTC', isOpen: hoursUTC >= 22 || hoursUTC < 7 },
    { name: 'Quotex OTC', hours: '24/7 Active Liquidity', isOpen: true, isOTC: true },
  ];

  const timeString = utcTime.toLocaleTimeString([], {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#0e121b] border-t border-[#1f2737] text-xs text-slate-400 select-none">
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-mono-numbers">UTC Time: <strong className="text-white">{timeString}</strong></span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {sessions.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                s.isOpen ? (s.isOTC ? 'bg-[#00e676]' : 'bg-emerald-400') : 'bg-slate-600'
              }`}
            />
            <span className={s.isOpen ? 'text-slate-200 font-medium' : 'text-slate-500'}>
              {s.name}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Globe className="w-3.5 h-3.5 text-slate-400" />
        <span>Quotex Servers Synced</span>
      </div>
    </div>
  );
};
