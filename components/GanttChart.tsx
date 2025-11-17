import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Ticket } from '../types';

// Utility Functions
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const diffInDays = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

interface GanttChartProps {
  tickets: Ticket[];
  onTicketUpdate: (updatedTicket: Ticket) => void;
}

type Interaction = {
  type: 'move' | 'resize-start' | 'resize-end';
  ticketId: string;
  startX: number;
  originalStartDate: Date;
  originalEndDate: Date;
} | null;

const GanttChart: React.FC<GanttChartProps> = ({ tickets, onTicketUpdate }) => {
  const [interaction, setInteraction] = useState<Interaction>(null);
  const [tempTicket, setTempTicket] = useState<Ticket | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const dayWidth = 40; // width of a single day column in pixels

  const { projectStartDate, projectEndDate, totalDays } = useMemo(() => {
    if (tickets.length === 0) {
      const today = new Date();
      return { projectStartDate: today, projectEndDate: addDays(today, 30), totalDays: 31 };
    }
    const startDates = tickets.map(t => t.startDate);
    const endDates = tickets.map(t => t.endDate);
    const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));
    
    const projectStartDate = addDays(minDate, -2);
    const projectEndDate = addDays(maxDate, 2);
    const totalDays = diffInDays(projectEndDate, projectStartDate) + 1;

    return { projectStartDate, projectEndDate, totalDays };
  }, [tickets]);

  const handleMouseDown = useCallback((e: React.MouseEvent, ticket: Ticket, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();
    setInteraction({
      type,
      ticketId: ticket.id,
      startX: e.clientX,
      originalStartDate: ticket.startDate,
      originalEndDate: ticket.endDate,
    });
    setTempTicket(ticket);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!interaction || !chartRef.current) return;

    const dx = e.clientX - interaction.startX;
    const daysMoved = Math.round(dx / dayWidth);

    setTempTicket(prevTicket => {
      if (!prevTicket) return null;
      let newStartDate = prevTicket.startDate;
      let newEndDate = prevTicket.endDate;

      if (interaction.type === 'move') {
        newStartDate = addDays(interaction.originalStartDate, daysMoved);
        newEndDate = addDays(interaction.originalEndDate, daysMoved);
      } else if (interaction.type === 'resize-start') {
        newStartDate = addDays(interaction.originalStartDate, daysMoved);
        if (newStartDate > interaction.originalEndDate) {
          newStartDate = interaction.originalEndDate;
        }
      } else if (interaction.type === 'resize-end') {
        newEndDate = addDays(interaction.originalEndDate, daysMoved);
         if (newEndDate < interaction.originalStartDate) {
          newEndDate = interaction.originalStartDate;
        }
      }
      return { ...prevTicket, startDate: newStartDate, endDate: newEndDate };
    });

  }, [interaction, dayWidth]);

  const handleMouseUp = useCallback(() => {
    if (interaction && tempTicket) {
      onTicketUpdate(tempTicket);
    }
    setInteraction(null);
    setTempTicket(null);
  }, [interaction, tempTicket, onTicketUpdate]);

  useEffect(() => {
    if (interaction) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, handleMouseMove, handleMouseUp]);


  const renderTimelineHeader = () => {
    const months: { name: string, year: number, days: number }[] = [];
    let currentMonth = -1;

    for (let i = 0; i < totalDays; i++) {
        const date = addDays(projectStartDate, i);
        const month = date.getMonth();
        if (month !== currentMonth) {
            currentMonth = month;
            months.push({ 
                name: date.toLocaleString('ja-JP', { month: 'long' }),
                year: date.getFullYear(),
                days: 0,
            });
        }
        months[months.length - 1].days++;
    }

    return (
      <div className="sticky top-0 z-20 bg-gray-800">
        <div className="flex" style={{ width: totalDays * dayWidth }}>
          {months.map((month, index) => (
            <div key={index} className="flex-shrink-0 text-center border-r border-b border-gray-700 h-8 flex items-center justify-center" style={{ width: month.days * dayWidth }}>
              <span className="text-sm font-semibold">{month.year}年 {month.name}</span>
            </div>
          ))}
        </div>
        <div className="flex h-[20px]" style={{ width: totalDays * dayWidth }}>
          {[...Array(totalDays)].map((_, i) => {
            const date = addDays(projectStartDate, i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div key={i} className={`flex-shrink-0 w-[${dayWidth}px] text-center border-r border-gray-700 ${isWeekend ? 'bg-gray-700/50' : ''}`} style={{ width: dayWidth}}>
                <span className="text-xs">{date.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTicketBar = (ticket: Ticket, index: number) => {
    const displayTicket = interaction?.ticketId === ticket.id && tempTicket ? tempTicket : ticket;
    const offsetDays = diffInDays(displayTicket.startDate, projectStartDate);
    const durationDays = diffInDays(displayTicket.endDate, displayTicket.startDate) + 1;
    
    const left = offsetDays * dayWidth;
    const width = durationDays * dayWidth;
    const top = index * 50 + 9; // Each row is 50px, bar is 32px (h-8), so (50-32)/2 = 9px offset
    
    const ticketColor = ticket.parentId ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500';
    const isInteracting = interaction?.ticketId === ticket.id;

    return (
       <div 
        key={ticket.id}
        className="absolute h-8 rounded-md transition-all duration-150 group" 
        style={{ top, left, width }}
       >
          <div 
            className={`relative w-full h-full ${ticketColor} rounded-md shadow-md cursor-move flex items-center justify-between px-2 ${isInteracting ? 'opacity-70 scale-105 shadow-lg' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, ticket, 'move')}
          >
            <span className="text-xs font-medium text-white truncate pointer-events-none">{ticket.name}</span>
            <div 
              onMouseDown={(e) => handleMouseDown(e, ticket, 'resize-start')}
              className="absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l-md opacity-0 group-hover:opacity-100 bg-white/20"
            />
            <div 
              onMouseDown={(e) => handleMouseDown(e, ticket, 'resize-end')}
              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-md opacity-0 group-hover:opacity-100 bg-white/20"
            />
          </div>
       </div>
    );
  };

  return (
    <div ref={chartRef} className="bg-gray-800/50 rounded-lg">
      {renderTimelineHeader()}
      <div className="relative" style={{ height: tickets.length * 50, width: totalDays * dayWidth }}>
        {/* Grid lines */}
        {[...Array(totalDays)].map((_, i) => (
             <div key={`v-${i}`} className="absolute top-0 bottom-0 border-r border-gray-700/50" style={{ left: (i + 1) * dayWidth, width: 1}} />
        ))}
        {tickets.map((ticket, index) => (
          <div key={`h-${ticket.id}`} className="absolute left-0 right-0 border-b border-gray-700/50" style={{ top: (index + 1) * 50, height: 1 }} />
        ))}

        {/* Ticket Bars */}
        {tickets.map((ticket, index) => renderTicketBar(ticket, index))}
      </div>
    </div>
  );
};

export default GanttChart;