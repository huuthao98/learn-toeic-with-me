'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  ListTodo,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

type FilterType = 'all' | 'active' | 'done';

const STORAGE_KEY = 'learn-english:todos';

// ─── Utils ────────────────────────────────────────────────────────────────────
const loadFromStorage = (): TodoItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TodoItem[]) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (todos: TodoItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
};

// ─── Component ────────────────────────────────────────────────────────────────
export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage after mount (SSR-safe)
  useEffect(() => {
    setTodos(loadFromStorage());
    setMounted(true);
  }, []);

  // Persist whenever todos change
  useEffect(() => {
    if (mounted) saveToStorage(todos);
  }, [todos, mounted]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const newTodo: TodoItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos(prev => [newTodo, ...prev]);
    setInput('');
    inputRef.current?.focus();
    toast.success('Đã thêm việc cần làm!');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    toast.success('Đã xóa!');
  };

  const clearDone = () => {
    const count = todos.filter(t => t.completed).length;
    if (!count) return;
    setTodos(prev => prev.filter(t => !t.completed));
    toast.success(`Đã dọn ${count} việc đã xong!`);
  };

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const doneCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  if (!mounted) return null;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <ListTodo className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold text-base text-foreground">Việc cần làm hôm nay</h2>
          </div>
          <div className="flex items-center gap-2">
            {doneCount > 0 && (
              <button
                onClick={clearDone}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                title="Xóa tất cả đã xong"
              >
                <RotateCcw className="w-3 h-3" />
                Dọn xong
              </button>
            )}
            <Badge variant="secondary" className="text-xs tabular-nums">
              {doneCount}/{totalCount}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {progressPct === 100 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" /> Hoàn thành tất cả!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-3 flex gap-2 border-b border-border/60">
        <Input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Thêm việc cần làm... (Enter để lưu)"
          className="flex-1 text-sm h-8"
        />
        <Button size="sm" onClick={addTodo} disabled={!input.trim()} className="h-8 px-3 shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="px-5 py-2 flex gap-1 border-b border-border/60">
        {(['all', 'active', 'done'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'active' ? 'Chưa xong' : 'Đã xong'}
          </button>
        ))}
      </div>

      {/* Todo list */}
      <ul className="divide-y divide-border/50 max-h-72 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
            <ListTodo className="w-8 h-8 opacity-30" />
            <p className="text-sm">
              {filter === 'done' ? 'Chưa hoàn thành việc nào!' : 'Danh sách trống!'}
            </p>
          </li>
        ) : (
          filtered.map(todo => (
            <li
              key={todo.id}
              className={`group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30 ${
                todo.completed ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                aria-label={todo.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu xong'}
              >
                {todo.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span
                className={`flex-1 text-sm leading-snug ${
                  todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                aria-label="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
