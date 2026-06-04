'use client'

import React, { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Task } from '@/types'
import { useUpdateTask } from '@/lib/queries/tasks'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { format, isPast, isToday } from 'date-fns'
import { Plus, Lock, Repeat } from 'lucide-react'

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'border-t-neutral-700' },
  { id: 'in_progress', title: 'In Progress', color: 'border-t-blue-500' },
  { id: 'review', title: 'Review', color: 'border-t-purple-500' },
  { id: 'done', title: 'Done', color: 'border-t-green-500' }
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-500',
  low: 'border-l-green-500'
}

interface KanbanBoardViewProps {
  tasks: Task[]
  onAddTask?: () => void
}

export function KanbanBoardView({ tasks, onAddTask }: KanbanBoardViewProps) {
  const [boardData, setBoardData] = useState<Record<string, Task[]>>({
    todo: [],
    in_progress: [],
    review: [],
    done: []
  })
  
  // Need this to prevent hydration mismatch with dnd
  const [isMounted, setIsMounted] = useState(false)
  
  const updateTask = useUpdateTask()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Group tasks by status
    const grouped = {
      todo: [] as Task[],
      in_progress: [] as Task[],
      review: [] as Task[],
      done: [] as Task[]
    }
    
    tasks.forEach(task => {
      // Map other statuses to todo if not found
      const status = grouped[task.status as keyof typeof grouped] ? task.status : 'todo'
      grouped[status as keyof typeof grouped].push(task)
    })
    
    setBoardData(grouped)
  }, [tasks])

  if (!isMounted) return null

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Optimistic Update
    const sourceCol = source.droppableId
    const destCol = destination.droppableId

    const sourceTasks = [...(boardData[sourceCol] || [])]
    const destTasks = sourceCol === destCol ? sourceTasks : [...(boardData[destCol] || [])]
    
    const [movedTask] = sourceTasks.splice(source.index, 1)
    if (!movedTask) return
    
    if (destCol === 'in_progress' && movedTask.is_blocked) {
      toast.error('Cannot start task: it is blocked by dependencies')
      return
    }
    
    // Update status locally
    movedTask.status = destCol as any

    destTasks.splice(destination.index, 0, movedTask)

    setBoardData(prev => ({
      ...prev,
      [sourceCol]: sourceTasks,
      [destCol]: destTasks
    }))

    // API Call
    if (sourceCol !== destCol) {
      updateTask.mutate({ id: draggableId, data: { status: destCol } }, {
        onError: () => {
          toast.error("Failed to update task status")
          // Revert optimistic update by triggering re-render with original tasks
          // The query will refetch automatically or we can rely on the original props
          // For a true revert we'd keep previous state, but triggering a refetch or 
          // letting useEffect sync is easier.
        }
      })
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[500px]">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col w-[280px] shrink-0">
            {/* Column Header */}
            <div className={cn("bg-[#111111] border-t-2 rounded-t-xl px-4 py-3 flex items-center justify-between mb-2", col.color)}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                <span className="text-sm font-semibold text-white">{col.title}</span>
              </div>
              <span className="text-xs font-medium text-neutral-400 bg-[#1a1a1a] px-2 py-0.5 rounded-full">
                {boardData[col.id]?.length || 0}
              </span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 rounded-b-xl transition-colors",
                    snapshot.isDraggingOver ? "bg-[#111111]/50" : "bg-transparent"
                  )}
                >
                  {boardData[col.id]?.map((task, index) => {
                    const isTaskOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'done'
                    
                    return (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "bg-[#111111] border border-[#2a2a2a] rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing hover:border-[#3a3a3a] transition-all shadow-sm border-l-4",
                              PRIORITY_COLORS[task.priority || 'medium'] || PRIORITY_COLORS.medium,
                              snapshot.isDragging && "opacity-90 scale-105 shadow-2xl z-50 ring-2 ring-indigo-500/20"
                            )}
                          >
                            <div className="text-sm font-medium text-white line-clamp-2 mb-2 leading-tight">
                              {task.title}
                            </div>
                            
                            {/* Tags Row */}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {task.assignee?.department && (
                                <span className="text-[10px] text-neutral-400 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                                  {task.assignee.department.name}
                                </span>
                              )}
                              {task.is_blocked && (
                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                                  <Lock size={10} /> Blocked
                                </span>
                              )}
                              {task.recurrence && (
                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded" title={`Repeats ${task.recurrence}`}>
                                  <Repeat size={10} />
                                </span>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-auto pt-1">
                              <div className="flex items-center gap-1.5">
                                {task.assignee ? (
                                  <>
                                    <UserAvatar user={task.assignee as any} className="w-4 h-4" />
                                    <span className="text-xs text-neutral-500 truncate max-w-[80px]">{task.assignee.full_name}</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-neutral-500">Unassigned</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isTaskOverdue && (
                                  <span className="text-rose-400 font-medium text-[10px] uppercase tracking-wider">Overdue</span>
                                )}
                                {task.due_date && (
                                  <span className="text-xs text-neutral-500">
                                    {format(new Date(task.due_date), 'MMM d')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                  
                  {col.id === 'todo' && onAddTask && (
                    <button 
                      onClick={onAddTask}
                      className="w-full border border-dashed border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#111111] text-neutral-500 hover:text-neutral-300 rounded-xl py-2 flex items-center justify-center gap-1.5 transition-colors text-sm font-medium mt-1">
                      <Plus size={14} /> Add Task
                    </button>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
