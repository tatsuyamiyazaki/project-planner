import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Ticket, Project, Assignee } from './types';
import { PROJECTS, TICKETS, ASSIGNEES } from './constants';
import TicketList, { TicketWithLevel } from './components/TicketList';
import GanttChart from './components/GanttChart';
import { FolderIcon, PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, CheckIcon } from './components/Icons';
import Modal from './components/Modal';

type ModalState =
  | { type: 'NONE' }
  | { type: 'ADD_PROJECT' }
  | { type: 'EDIT_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; project: Project }
  | { type: 'ADD_TICKET' }
  | { type: 'EDIT_TICKET'; ticket: Ticket }
  | { type: 'DELETE_TICKET'; ticket: Ticket }
  | { type: 'MANAGE_ASSIGNEES' };

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [assignees, setAssignees] = useState<Assignee[]>(ASSIGNEES);
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(PROJECTS[0]?.id || '');
  
  const [modalState, setModalState] = useState<ModalState>({ type: 'NONE' });

  // State for assignee management modal
  const [editingAssignee, setEditingAssignee] = useState<{id: string, name: string} | null>(null);
  const [newAssigneeName, setNewAssigneeName] = useState('');

  const [sidebarWidth, setSidebarWidth] = useState(600);
  const isResizing = useRef(false);

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const parentIds = new Set(TICKETS.filter(t => TICKETS.some(c => c.parentId === t.id)).map(t => t.id));
    return parentIds;
  });

  const toggleExpand = useCallback((ticketId: string) => {
    setExpanded(prev => {
        const newSet = new Set(prev);
        if (newSet.has(ticketId)) {
            newSet.delete(ticketId);
        } else {
            newSet.add(ticketId);
        }
        return newSet;
    });
  }, []);
  
  const currentProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const projectTickets = useMemo(() => tickets.filter(t => t.projectId === selectedProjectId), [tickets, selectedProjectId]);

  const visibleTickets = useMemo((): TicketWithLevel[] => {
    const childrenMap = new Map<string | null, string[]>();
    projectTickets.forEach(t => {
        const children = childrenMap.get(t.parentId) || [];
        children.push(t.id);
        childrenMap.set(t.parentId, children);
    });

    const ticketMap = new Map<string, Ticket>(projectTickets.map(t => [t.id, t]));
    
    for (const [parentId, children] of childrenMap.entries()) {
        children.sort((a, b) => {
            const ticketA = ticketMap.get(a)!;
            const ticketB = ticketMap.get(b)!;
            return ticketA.sortOrder - ticketB.sortOrder;
        });
        childrenMap.set(parentId, children);
    }
    
    const result: TicketWithLevel[] = [];

    const visit = (ticketId: string, level: number) => {
        const ticket = ticketMap.get(ticketId);
        if (!ticket) return;

        const childrenIds = childrenMap.get(ticketId) || [];
        result.push(Object.assign({}, ticket, { level, hasChildren: childrenIds.length > 0 }));

        if (expanded.has(ticketId)) {
            for (const childId of childrenIds) {
                visit(childId, level + 1);
            }
        }
    };

    const rootIds = childrenMap.get(null) || [];

    for (const ticketId of rootIds) {
        visit(ticketId, 0);
    }
    return result;
  }, [projectTickets, expanded]);


  // CRUD Handlers
  const handleAddProject = (name: string) => {
    const newProject: Project = { id: crypto.randomUUID(), name };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setModalState({ type: 'NONE' });
  };
  
  const handleEditProject = (id: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    setModalState({ type: 'NONE' });
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTickets(prev => prev.filter(t => t.projectId !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(projects.find(p => p.id !== id)?.id || '');
    }
    setModalState({ type: 'NONE' });
  };
  
  const handleAddTicket = (data: Omit<Ticket, 'id' | 'projectId' | 'sortOrder'>) => {
    const siblings = tickets.filter(t => t.projectId === selectedProjectId && t.parentId === data.parentId);
    const newTicket: Ticket = {
      ...data,
      id: crypto.randomUUID(),
      projectId: selectedProjectId,
      sortOrder: siblings.length,
    };
    setTickets(prev => [...prev, newTicket]);
    if (data.parentId) {
      setExpanded(prev => new Set(prev).add(data.parentId!));
    }
    setModalState({ type: 'NONE' });
  };
  
  const handleEditTicket = (updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setModalState({ type: 'NONE' });
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets(prev => {
      const toDelete = new Set<string>([ticketId]);
      const queue = [ticketId];
      while(queue.length > 0) {
        const currentId = queue.shift()!;
        prev.forEach(t => {
          if (t.parentId === currentId) {
            toDelete.add(t.id);
            queue.push(t.id);
          }
        });
      }
      return prev.filter(t => !toDelete.has(t.id));
    });
    setModalState({ type: 'NONE' });
  };

  const handleAddAssignee = (name: string) => {
    if (!name.trim()) return;
    const newAssignee: Assignee = { id: crypto.randomUUID(), name: name.trim() };
    setAssignees(prev => [...prev, newAssignee]);
    setNewAssigneeName('');
  };

  const handleUpdateAssignee = (id: string, name: string) => {
    if (!name.trim()) return;
    setAssignees(prev => prev.map(a => a.id === id ? { ...a, name: name.trim() } : a));
    setEditingAssignee(null);
  };
  
  const handleDeleteAssignee = (id: string) => {
    setTickets(prev => prev.map(t => t.assigneeId === id ? { ...t, assigneeId: null } : t));
    setAssignees(prev => prev.filter(a => a.id !== id));
  };

  const handleTicketUpdate = useCallback((updatedTicket: Ticket) => {
    setTickets(prevTickets =>
      prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
  }, []);

  const handleTicketReorder = useCallback((draggedId: string, targetId: string) => {
    setTickets(prevTickets => {
      const draggedTicket = prevTickets.find(t => t.id === draggedId);
      const targetTicket = prevTickets.find(t => t.id === targetId);

      if (!draggedTicket || !targetTicket || draggedTicket.parentId !== targetTicket.parentId) {
        return prevTickets;
      }

      const siblings = prevTickets
        .filter(t => t.parentId === draggedTicket.parentId && t.projectId === selectedProjectId)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const draggedIndex = siblings.findIndex(t => t.id === draggedId);
      const [removed] = siblings.splice(draggedIndex, 1);
      const targetIndex = siblings.findIndex(t => t.id === targetId);
      siblings.splice(targetIndex, 0, removed);

      const updatedSiblings = new Map<string, Ticket>();
      siblings.forEach((ticket, index) => {
        if (ticket.sortOrder !== index) {
          updatedSiblings.set(ticket.id, { ...ticket, sortOrder: index });
        }
      });
      
      if (updatedSiblings.size === 0) return prevTickets;

      return prevTickets.map(t => updatedSiblings.get(t.id) || t);
    });
  }, [selectedProjectId]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    setSidebarWidth(prev => {
        const newWidth = e.clientX;
        if (newWidth > 350 && newWidth < window.innerWidth - 250) {
            return newWidth;
        }
        return prev;
    });
  }, []);

  const handleMouseUp = () => {
    isResizing.current = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);
  
  const handleScroll = (scroller: 'left' | 'right') => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    
    const left = leftPanelRef.current;
    const right = rightPanelRef.current;

    if (left && right) {
        if (scroller === 'left') {
            right.scrollTop = left.scrollTop;
        } else {
            left.scrollTop = right.scrollTop;
        }
    }
    
    requestAnimationFrame(() => {
        isSyncingScroll.current = false;
    });
  };
  
  const renderModalContent = () => {
    if (modalState.type === 'NONE') return null;

    if (modalState.type === 'ADD_PROJECT' || modalState.type === 'EDIT_PROJECT') {
        const isEdit = modalState.type === 'EDIT_PROJECT';
        const project = isEdit ? modalState.project : null;
        return (
            <form onSubmit={(e) => {
                e.preventDefault();
                const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
                if (name) {
                    isEdit ? handleEditProject(project!.id, name) : handleAddProject(name);
                }
            }}>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">プロジェクト名</label>
                <input type="text" id="name" name="name" defaultValue={project?.name || ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus/>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalState({ type: 'NONE' })} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">キャンセル</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors">保存</button>
                </div>
            </form>
        );
    }

    if (modalState.type === 'DELETE_PROJECT') {
        const { project } = modalState;
        return (
            <div>
                <p>本当にプロジェクト「{project.name}」を削除しますか？</p>
                <p className="text-sm text-red-400 mt-2">この操作は元に戻せません。関連するすべてのチケットも削除されます。</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalState({ type: 'NONE' })} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">キャンセル</button>
                    <button type="button" onClick={() => handleDeleteProject(project.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors">削除</button>
                </div>
            </div>
        )
    }

    if (modalState.type === 'ADD_TICKET' || modalState.type === 'EDIT_TICKET') {
        const isEdit = modalState.type === 'EDIT_TICKET';
        const ticket = isEdit ? modalState.ticket : null;
        
        const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

        return (
            <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const startDate = new Date((form.elements.namedItem('startDate') as HTMLInputElement).value);
                const endDate = new Date((form.elements.namedItem('endDate') as HTMLInputElement).value);
                const assigneeId = (form.elements.namedItem('assigneeId') as HTMLSelectElement).value || null;
                const parentId = (form.elements.namedItem('parentId') as HTMLSelectElement).value || null;
                
                if (name && startDate <= endDate) {
                    const ticketData = { name, startDate, endDate, assigneeId, parentId };
                    isEdit ? handleEditTicket({ ...ticket!, ...ticketData }) : handleAddTicket(ticketData);
                } else {
                    alert("終了日は開始日以降に設定してください。");
                }
            }}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">タスク名</label>
                        <input type="text" name="name" defaultValue={ticket?.name || ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">開始日</label>
                             <input type="date" name="startDate" defaultValue={ticket ? formatDateForInput(ticket.startDate) : ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                             <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">終了日</label>
                             <input type="date" name="endDate" defaultValue={ticket ? formatDateForInput(ticket.endDate) : ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                     </div>
                     <div>
                        <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-300 mb-1">担当者</label>
                        <select name="assigneeId" defaultValue={ticket?.assigneeId || ''} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                             <option value="">未割り当て</option>
                             {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label htmlFor="parentId" className="block text-sm font-medium text-gray-300 mb-1">親チケット</label>
                        <select name="parentId" defaultValue={ticket?.parentId || ''} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                             <option value="">なし (ルートチケット)</option>
                             {projectTickets.filter(t => t.id !== ticket?.id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                     </div>
                </div>
                 <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalState({ type: 'NONE' })} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">キャンセル</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors">保存</button>
                </div>
            </form>
        )
    }

    if (modalState.type === 'DELETE_TICKET') {
        const { ticket } = modalState;
        return (
            <div>
                <p>本当にチケット「{ticket.name}」を削除しますか？</p>
                <p className="text-sm text-red-400 mt-2">この操作は元に戻せません。このチケットの子チケットもすべて削除されます。</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setModalState({ type: 'NONE' })} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">キャンセル</button>
                    <button type="button" onClick={() => handleDeleteTicket(ticket.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors">削除</button>
                </div>
            </div>
        )
    }

    if (modalState.type === 'MANAGE_ASSIGNEES') {
      return (
        <div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-4">
            {assignees.map(assignee => (
              <div key={assignee.id} className="flex items-center justify-between gap-2 bg-gray-700/50 p-2 rounded-md">
                {editingAssignee?.id === assignee.id ? (
                  <input
                    type="text"
                    value={editingAssignee.name}
                    onChange={(e) => setEditingAssignee({ ...editingAssignee, name: e.target.value })}
                    className="flex-grow bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateAssignee(editingAssignee.id, editingAssignee.name)}
                    onBlur={() => setEditingAssignee(null)}
                  />
                ) : (
                  <span className="flex-grow text-sm">{assignee.name}</span>
                )}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {editingAssignee?.id === assignee.id ? (
                    <button 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleUpdateAssignee(editingAssignee.id, editingAssignee.name)} 
                      className="p-1 text-green-400 hover:text-green-300" title="保存">
                        <CheckIcon className="w-5 h-5"/>
                    </button>
                  ) : (
                    <button onClick={() => setEditingAssignee({id: assignee.id, name: assignee.name})} className="p-1 text-gray-400 hover:text-white" title="編集"><PencilIcon className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => {
                    if (window.confirm(`担当者「${assignee.name}」を削除しますか？\n関連するチケットは「未割り当て」になります。`)) {
                      handleDeleteAssignee(assignee.id);
                    }
                  }} className="p-1 text-gray-400 hover:text-red-500" title="削除"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <form className="mt-4 pt-4 border-t border-gray-700 flex gap-2" onSubmit={(e) => { e.preventDefault(); handleAddAssignee(newAssigneeName); }}>
            <input
              type="text"
              placeholder="新しい担当者名"
              value={newAssigneeName}
              onChange={e => setNewAssigneeName(e.target.value)}
              className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors">追加</button>
          </form>
        </div>
      );
    }

    return null;
  }
  
  const getModalTitle = () => {
    switch (modalState.type) {
      case 'ADD_PROJECT': return 'プロジェクトを追加';
      case 'EDIT_PROJECT': return 'プロジェクトを編集';
      case 'DELETE_PROJECT': return 'プロジェクトを削除';
      case 'ADD_TICKET': return 'チケットを追加';
      case 'EDIT_TICKET': return 'チケットを編集';
      case 'DELETE_TICKET': return 'チケットを削除';
      case 'MANAGE_ASSIGNEES': return '担当者を管理';
      default: return '';
    }
  };

  return (
    <>
    <Modal
        isOpen={modalState.type !== 'NONE'}
        onClose={() => setModalState({ type: 'NONE' })}
        title={getModalTitle()}
    >
        {renderModalContent()}
    </Modal>
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">プロジェクト プランナー</h1>
          <button 
            onClick={() => setModalState({type: 'ADD_TICKET'})} 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            チケットを追加
          </button>
        </div>
        <div className="flex items-center gap-4">
            <button
                onClick={() => setModalState({ type: 'MANAGE_ASSIGNEES' })}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-200 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                title="担当者を管理"
            >
                <UserGroupIcon className="w-5 h-5" />
                <span>担当者管理</span>
            </button>
            <div className="w-px h-6 bg-gray-600" />
            <span className="text-sm text-gray-400">プロジェクト:</span>
             <div className="flex items-center gap-2">
                <div className="relative">
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="bg-gray-800 border border-gray-600 rounded-md py-2 pl-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                        {projects.length === 0 && <option>プロジェクトがありません</option>}
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <FolderIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <button onClick={() => setModalState({type: 'ADD_PROJECT'})} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600" title="プロジェクトを追加"><PlusIcon className="w-5 h-5"/></button>
                {currentProject && <>
                    <button onClick={() => setModalState({type: 'EDIT_PROJECT', project: currentProject})} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600" title="プロジェクトを編集"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => setModalState({type: 'DELETE_PROJECT', project: currentProject})} className="p-2 bg-gray-700 rounded-md hover:bg-red-500" title="プロジェクトを削除"><TrashIcon className="w-5 h-5"/></button>
                </>}
             </div>
        </div>
      </header>
      
      <main className="flex-grow flex p-4 gap-4 min-h-0">
        <div ref={leftPanelRef} onScroll={() => handleScroll('left')} style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 h-full overflow-y-auto overflow-x-hidden">
            <TicketList 
              tickets={visibleTickets} 
              assignees={assignees} 
              expanded={expanded} 
              onToggleExpand={toggleExpand}
              onTicketReorder={handleTicketReorder}
              onEditTicket={(ticket) => setModalState({type: 'EDIT_TICKET', ticket})}
              onDeleteTicket={(ticket) => setModalState({type: 'DELETE_TICKET', ticket})}
            />
        </div>

        <div 
          className="w-1.5 cursor-col-resize bg-gray-700 hover:bg-blue-500 transition-colors duration-200 rounded-full"
          onMouseDown={handleMouseDown}
        />

        <div ref={rightPanelRef} onScroll={() => handleScroll('right')} className="flex-grow h-full min-w-0 overflow-auto">
            <GanttChart tickets={visibleTickets} onTicketUpdate={handleTicketUpdate} />
        </div>
      </main>
    </div>
    </>
  );
};

export default App;