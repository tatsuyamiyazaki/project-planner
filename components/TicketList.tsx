import React, { useState } from 'react';
import { Ticket, Assignee } from '../types';
import { ChevronDownIcon, DocumentIcon, FolderIcon, PencilIcon, TrashIcon, PlusIcon } from './Icons';

export interface TicketWithLevel extends Ticket {
  level: number;
  hasChildren: boolean;
}

interface TicketListProps {
  tickets: TicketWithLevel[];
  assignees: Assignee[];
  expanded: Set<string>;
  onToggleExpand: (ticketId: string) => void;
  onTicketReorder: (draggedId: string, targetId: string) => void;
  onEditTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticket: Ticket) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, assignees, expanded, onToggleExpand, onTicketReorder, onEditTicket, onDeleteTicket }) => {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const formatDate = (date: Date) => 
    date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  
  const assigneeMap: Map<string, Assignee> = new Map(assignees.map(a => [a.id, a]));

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('text/plain', ticketId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(ticketId);
  };

  const handleDragOver = (e: React.DragEvent, ticketId: string) => {
    e.preventDefault();
    if (draggedId !== ticketId) {
        setDragOverId(ticketId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };
  
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  }

  const handleDrop = (e: React.DragEvent, targetTicketId: string) => {
    e.preventDefault();
    const draggedTicketId = e.dataTransfer.getData('text/plain');
    if (draggedTicketId && draggedTicketId !== targetTicketId) {
        onTicketReorder(draggedTicketId, targetTicketId);
    }
    handleDragEnd();
  };

  return (
    <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg transition-colors duration-200">
       <div className="sticky top-0 bg-gray-100 dark:bg-gray-800 px-2 text-xs font-bold text-gray-500 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10 h-[52px] box-border">
          <div className="flex-grow">タスク名</div>
          <div className="flex items-center">
            <div className="flex-shrink-0 w-24 text-center">担当者</div>
            <div className="flex-shrink-0 w-48 text-right pr-2">期間</div>
            <div className="w-12 flex-shrink-0"></div> {/* Space for buttons */}
          </div>
        </div>
      <div className="relative">
        {tickets.map((ticket) => {
           const assignee = ticket.assigneeId ? assigneeMap.get(ticket.assigneeId) : null;
           const isDragged = draggedId === ticket.id;
           const isDragOver = dragOverId === ticket.id;

           return (
            <div
              key={ticket.id}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, ticket.id)}
              onDragOver={(e) => handleDragOver(e, ticket.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, ticket.id)}
              onDragEnd={handleDragEnd}
              className={`group relative flex items-center h-[50px] border-b border-gray-200/50 dark:border-gray-700/50 box-border transition-opacity ${isDragged ? 'opacity-30' : 'opacity-100'} ${isDragOver ? 'border-t-2 border-blue-500 -mt-0.5' : ''}`}
              style={{ paddingLeft: `${ticket.level * 20 + 8}px` }}
            >
              <div className="flex items-center gap-2 flex-grow min-w-0">
                {ticket.hasChildren ? (
                  <button onClick={() => onToggleExpand(ticket.id)} className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${expanded.has(ticket.id) ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <div className="w-5 h-5"></div>
                )}

                <div className="text-blue-500 dark:text-blue-400">
                   {ticket.hasChildren ? <FolderIcon /> : <DocumentIcon />}
                </div>

                <span className="truncate text-sm font-medium">{ticket.name}</span>
              </div>
              <div className="flex-shrink-0 w-24 text-center text-xs text-gray-600 dark:text-gray-300">
                {assignee ? assignee.name : '未割り当て'}
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2 ml-4 flex-shrink-0 w-48 justify-end">
                <span>{formatDate(ticket.startDate)}</span>
                <span>&rarr;</span>
                <span>{formatDate(ticket.endDate)}</span>
              </div>
              <div className="w-12 flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => onEditTicket(ticket)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                 <button onClick={() => onDeleteTicket(ticket)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default TicketList;