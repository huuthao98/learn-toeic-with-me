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
  Clock,
  Tag,
  AlertCircle,
  ChevronDown,
  Filter,
  Repeat,
  Sunrise,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export type TodoCategory = 'toeic' | 'vocab' | 'interview' | 'chinese' | 'idea' | 'general';
export type TodoPriority = 'high' | 'medium' | 'low';

export interface TodoItem {
  id: string;
  text: string;
  category?: TodoCategory;
  priority?: TodoPriority;
  estimatedMinutes?: number;
  completed: boolean;
  isDaily?: boolean; // Thói quen lặp lại hằng ngày (reset 6h sáng)
  createdAt: number;
}

type FilterType = 'all' | 'active' | 'done' | 'daily';

const STORAGE_KEY = 'learn-english:todos';
const CYCLE_STORAGE_KEY = 'learn-english:todos-cycle';

const CATEGORY_CONFIG: Record<
  TodoCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  toeic: {
    label: 'TOEIC',
    bg: 'bg-chart-1/10',
    text: 'text-chart-1',
    border: 'border-chart-1/20',
  },
  vocab: {
    label: 'Từ vựng',
    bg: 'bg-chart-2/10',
    text: 'text-chart-2',
    border: 'border-chart-2/20',
  },
  interview: {
    label: 'Phỏng vấn',
    bg: 'bg-chart-3/10',
    text: 'text-chart-3',
    border: 'border-chart-3/20',
  },
  chinese: {
    label: 'Tiếng Trung',
    bg: 'bg-chart-5/10',
    text: 'text-chart-5',
    border: 'border-chart-5/20',
  },
  idea: {
    label: 'Ý tưởng 💡',
    bg: 'bg-chart-4/10',
    text: 'text-chart-4',
    border: 'border-chart-4/20',
  },
  general: {
    label: 'Rèn luyện',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

const PRIORITY_CONFIG: Record<TodoPriority, { label: string; color: string; badgeBg: string }> = {
  high: {
    label: 'Ưu tiên cao',
    color: 'text-destructive',
    badgeBg: 'bg-destructive/10 text-destructive',
  },
  medium: { label: 'Vừa', color: 'text-amber-500', badgeBg: 'bg-amber-500/10 text-amber-500' },
  low: { label: 'Thấp', color: 'text-muted-foreground', badgeBg: 'bg-muted text-muted-foreground' },
};

// ─── Default Daily Routine Habits (Reset 6h sáng mỗi ngày) ───────────────────
const DEFAULT_DAILY_ROUTINES: TodoItem[] = [
  {
    id: 'daily-pushup',
    text: 'Hít đất 100 cái (rèn luyện thể lực & ý chí bền bỉ)',
    category: 'general',
    priority: 'high',
    estimatedMinutes: 15,
    completed: false,
    isDaily: true,
    createdAt: Date.now(),
  },
  {
    id: 'daily-chinese',
    text: 'Viết ra 5 từ vựng tiếng Trung mới & nhớ mặt chữ',
    category: 'chinese',
    priority: 'medium',
    estimatedMinutes: 15,
    completed: false,
    isDaily: true,
    createdAt: Date.now(),
  },
  {
    id: 'daily-english-sentences',
    text: 'Học 5 câu tiếng Anh giao tiếp mới & nhại giọng theo audio',
    category: 'vocab',
    priority: 'high',
    estimatedMinutes: 15,
    completed: false,
    isDaily: true,
    createdAt: Date.now(),
  },
  {
    id: 'daily-toeic-listening',
    text: 'Luyện 1 bài nghe ngắn TOEIC Part 3 (Conversation)',
    category: 'toeic',
    priority: 'medium',
    estimatedMinutes: 20,
    completed: false,
    isDaily: true,
    createdAt: Date.now(),
  },
  {
    id: 'daily-star-question',
    text: 'Luyện trả lời 1 câu hỏi phỏng vấn theo phương pháp STAR',
    category: 'interview',
    priority: 'low',
    estimatedMinutes: 10,
    completed: false,
    isDaily: true,
    createdAt: Date.now(),
  },
];

// ─── 6:00 AM Cycle Utilities ──────────────────────────────────────────────────
/**
 * Lấy mã chu kỳ ngày (Cycle Key) dựa trên mốc 6:00 AM.
 * - Trước 6:00 AM: thuộc chu kỳ của ngày hôm trước.
 * - Từ 6:00 AM trở đi: thuộc chu kỳ của ngày hôm nay.
 */
export const get6AmCycleKey = (date: Date = new Date()): string => {
  const d = new Date(date);
  if (d.getHours() < 6) {
    // Thuộc chu kỳ bắt đầu từ 6h sáng hôm qua
    d.setDate(d.getDate() - 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadAndSyncTodos = (): { todos: TodoItem[]; wasReset: boolean } => {
  try {
    const currentCycle = get6AmCycleKey();
    const storedCycle = localStorage.getItem(CYCLE_STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);

    let list: TodoItem[] = [];
    if (raw) {
      list = JSON.parse(raw) as TodoItem[];
    }

    // Nếu chưa có dữ liệu, khởi tạo với danh sách công việc hàng ngày
    if (!list || list.length === 0) {
      localStorage.setItem(CYCLE_STORAGE_KEY, currentCycle);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DAILY_ROUTINES));
      return { todos: DEFAULT_DAILY_ROUTINES, wasReset: false };
    }

    // Kiểm tra xem đã bước sang chu kỳ 6h sáng mới chưa
    const isNewCycle = storedCycle !== currentCycle;

    if (isNewCycle) {
      // Reset trạng thái hoàn thành của các công việc hàng ngày
      const updatedList = list.map(item => {
        if (item.isDaily) {
          return { ...item, completed: false };
        }
        return item;
      });

      // Đảm bảo các thói quen mặc định không bị mất nếu danh sách trống
      const existingIds = new Set(updatedList.map(i => i.id));
      DEFAULT_DAILY_ROUTINES.forEach(defItem => {
        if (!existingIds.has(defItem.id)) {
          updatedList.push({ ...defItem, completed: false });
        }
      });

      localStorage.setItem(CYCLE_STORAGE_KEY, currentCycle);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      return { todos: updatedList, wasReset: true };
    }

    return { todos: list, wasReset: false };
  } catch {
    return { todos: DEFAULT_DAILY_ROUTINES, wasReset: false };
  }
};

const saveToStorage = (todos: TodoItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // ignore
  }
};

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<TodoCategory>('general');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [isDaily, setIsDaily] = useState<boolean>(true);
  const [showOptions, setShowOptions] = useState(false);

  // Edit Modal State
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<TodoPriority>('medium');
  const [editCategory, setEditCategory] = useState<TodoCategory>('general');
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState<number>(15);
  const [editIsDaily, setEditIsDaily] = useState<boolean>(false);

  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { todos: loadedTodos, wasReset } = loadAndSyncTodos();
    setTodos(loadedTodos);
    setMounted(true);

    if (wasReset) {
      toast.info('Chào ngày mới! Các mục tiêu hằng ngày đã được làm mới lúc 6:00 sáng 🌅', {
        duration: 5000,
      });
    }
  }, []);

  useEffect(() => {
    if (mounted) saveToStorage(todos);
  }, [todos, mounted]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const newTodo: TodoItem = {
      id: crypto.randomUUID(),
      text,
      category,
      priority,
      estimatedMinutes,
      isDaily,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos(prev => [newTodo, ...prev]);
    setInput('');
    setShowOptions(false);
    inputRef.current?.focus();
    toast.success(
      isDaily
        ? 'Đã thêm thói quen hàng ngày! (Tự động reset lúc 6:00 sáng) 🔁'
        : 'Đã thêm việc cần làm hôm nay!',
    );
  };

  const openEditModal = (todo: TodoItem) => {
    setEditingTodo(todo);
    setEditText(todo.text);
    setEditPriority(todo.priority || 'medium');
    setEditCategory(todo.category || 'general');
    setEditEstimatedMinutes(todo.estimatedMinutes || 15);
    setEditIsDaily(!!todo.isDaily);
  };

  const saveEditedTodo = () => {
    if (!editingTodo) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      toast.error('Nội dung công việc không được để trống!');
      return;
    }

    setTodos(prev =>
      prev.map(t =>
        t.id === editingTodo.id
          ? {
              ...t,
              text: trimmed,
              priority: editPriority,
              category: editCategory,
              estimatedMinutes: editEstimatedMinutes,
              isDaily: editIsDaily,
            }
          : t,
      ),
    );
    setEditingTodo(null);
    toast.success('Đã cập nhật công việc thành công! ✨');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(t => {
        if (t.id === id) {
          const nextState = !t.completed;
          if (nextState) {
            toast.success('Tuyệt vời! Đã hoàn thành nhiệm vụ 🎉');
          }
          return { ...t, completed: nextState };
        }
        return t;
      }),
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

  // Reset thủ công chu kỳ ngày (để test hoặc chủ động bắt đầu ngày mới)
  const manualResetDaily = () => {
    const resetList = todos.map(t => (t.isDaily ? { ...t, completed: false } : t));
    setTodos(resetList);
    toast.success('Đã làm mới lại các thói quen hằng ngày! 🌅');
  };

  const filtered = todos.filter(t => {
    if (filter === 'active' && t.completed) return false;
    if (filter === 'done' && !t.completed) return false;
    if (filter === 'daily' && !t.isDaily) return false;
    if (categoryFilter !== 'all' && (t.category || 'general') !== categoryFilter) return false;
    return true;
  });

  const doneCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const totalTimeLeft = todos
    .filter(t => !t.completed)
    .reduce((sum, t) => sum + (t.estimatedMinutes || 15), 0);

  if (!mounted) return null;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border/60 bg-gradient-to-r from-primary/5 via-card to-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <ListTodo className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg text-foreground">Việc cần làm & Thói quen</h2>
                <Badge variant="secondary" className="text-xs font-bold tabular-nums px-2 py-0.5">
                  {doneCount}/{totalCount}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  <Sunrise className="w-3 h-3" /> Reset 6:00 AM
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mục tiêu nhỏ hằng ngày • Còn{' '}
                <span className="font-semibold text-foreground">{totalTimeLeft} phút</span> rèn
                luyện
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={manualResetDaily}
              className="text-xs h-8 px-2.5 gap-1.5 border-border text-muted-foreground hover:text-foreground"
              title="Làm mới lại toàn bộ thói quen ngày"
            >
              <Repeat className="w-3.5 h-3.5 text-primary" />
              <span className="hidden md:inline">Làm mới ngày</span>
            </Button>

            {doneCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDone}
                className="text-xs text-muted-foreground hover:text-destructive h-8 px-2.5 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Dọn xong ({doneCount})
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Tiến độ hoàn thành hôm nay</span>
              <span className="text-primary font-bold">{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {progressPct === 100 && (
              <p className="text-xs text-emerald-500 flex items-center gap-1.5 font-bold pt-1">
                <Sparkles className="w-4 h-4" /> Xuất sắc! Bạn đã hoàn thành toàn bộ mục tiêu hôm
                nay!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 space-y-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="Thêm thói quen hoặc việc nhỏ hôm nay"
            className="flex-1 text-sm h-10 bg-background border-border"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className={`h-10 px-3 shrink-0 gap-1.5 ${showOptions ? 'bg-accent text-accent-foreground' : ''}`}
            title="Tùy chọn tag, thời gian và độ ưu tiên"
          >
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline text-xs font-medium">Chi tiết</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showOptions ? 'rotate-180' : ''}`}
            />
          </Button>
          <Button
            size="sm"
            onClick={addTodo}
            disabled={!input.trim()}
            className="h-10 px-4 shrink-0 gap-1.5 font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm việc</span>
          </Button>
        </div>

        {/* Extended Options Bar */}
        {showOptions && (
          <div className="p-3.5 bg-background border border-border rounded-xl flex flex-wrap items-center gap-4 text-xs animate-in fade-in-50 duration-200">
            {/* Daily Habit Toggle */}
            <div className="flex items-center gap-2 pr-2 border-r border-border/60">
              <label
                htmlFor="is-daily-check"
                className="flex items-center gap-1.5 cursor-pointer font-bold text-foreground select-none"
              >
                <input
                  id="is-daily-check"
                  type="checkbox"
                  checked={isDaily}
                  onChange={e => setIsDaily(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="flex items-center gap-1 text-primary">
                  <Repeat className="w-3.5 h-3.5" /> Lặp lại hằng ngày (Reset 6h sáng)
                </span>
              </label>
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Phân loại:</span>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(CATEGORY_CONFIG) as TodoCategory[]).map(catKey => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                        isSelected
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-primary/40`
                          : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Ưu tiên:</span>
              <div className="flex gap-1">
                {(['high', 'medium', 'low'] as TodoPriority[]).map(pKey => {
                  const pCfg = PRIORITY_CONFIG[pKey];
                  const isSelected = priority === pKey;
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => setPriority(pKey)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                        isSelected
                          ? `${pCfg.badgeBg} border-current ring-1 ring-primary/30`
                          : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {pCfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Thời gian:</span>
              <div className="flex gap-1">
                {[10, 15, 20, 30, 45].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedMinutes(mins)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      estimatedMinutes === mins
                        ? 'bg-primary/10 text-primary border-primary/30 ring-1 ring-primary/30'
                        : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-card">
        {/* Status Filter */}
        <div className="flex items-center gap-1">
          {(
            [
              { key: 'all', label: 'Tất cả' },
              { key: 'active', label: 'Chưa làm' },
              { key: 'daily', label: '🔁 Thói quen ngày' },
              { key: 'done', label: 'Đã xong' },
            ] as { key: FilterType; label: string }[]
          ).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
              categoryFilter === 'all'
                ? 'bg-foreground text-background font-bold'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Mọi thẻ
          </button>
          {(Object.keys(CATEGORY_CONFIG) as TodoCategory[]).map(cKey => (
            <button
              key={cKey}
              onClick={() => setCategoryFilter(cKey)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                categoryFilter === cKey
                  ? 'bg-foreground text-background font-bold'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {CATEGORY_CONFIG[cKey].label}
            </button>
          ))}
        </div>
      </div>

      {/* Todo List Items (Spacious Horizontal Layout) */}
      <ul className="divide-y divide-border/40 max-h-[420px] overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <li className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground text-center px-4">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
              <ListTodo className="w-6 h-6 opacity-40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {filter === 'done'
                  ? 'Chưa có mục tiêu nào hoàn thành!'
                  : 'Không có việc nào phù hợp bộ lọc'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filter === 'done'
                  ? 'Hãy chọn một nhiệm vụ nhỏ và hoàn thành để xây dựng thói quen nhé!'
                  : 'Nhập thói quen hoặc việc cần làm ở ô phía trên để bắt đầu.'}
              </p>
            </div>
          </li>
        ) : (
          filtered.map(todo => {
            const catCfg = CATEGORY_CONFIG[todo.category || 'general'] || CATEGORY_CONFIG.general;

            return (
              <li
                key={todo.id}
                className={`group flex items-center justify-between gap-4 px-6 py-3.5 transition-all hover:bg-accent/40 ${
                  todo.completed ? 'bg-muted/10 opacity-60' : ''
                }`}
              >
                {/* Left check & text */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-transform active:scale-90"
                    aria-label={todo.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu xong'}
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <Circle className="w-5 h-5 group-hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium leading-relaxed break-words ${
                          todo.completed
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground font-semibold'
                        }`}
                      >
                        {todo.text}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Daily Repeat Badge */}
                      {todo.isDaily && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                          <Repeat className="w-3 h-3" />
                          Hằng ngày (6h)
                        </span>
                      )}

                      {/* Category Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                      >
                        {catCfg.label}
                      </span>

                      {/* Estimated Duration */}
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        {todo.estimatedMinutes || 15}m
                      </span>

                      {/* Priority Tag */}
                      {todo.priority === 'high' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                          <AlertCircle className="w-3 h-3" />
                          Ưu tiên cao
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right action button */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(todo)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-all"
                    aria-label="Chỉnh sửa"
                    title="Chỉnh sửa công việc"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                    aria-label="Xóa"
                    title="Xóa nhiệm vụ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* Edit Todo Modal */}
      <Dialog open={!!editingTodo} onOpenChange={open => !open && setEditingTodo(null)}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              Chỉnh sửa công việc
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Input Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nội dung công việc <span className="text-destructive">*</span>
              </label>
              <Input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEditedTodo()}
                placeholder="Nhập nội dung việc cần làm..."
                className="text-sm h-10"
              />
            </div>

            {/* Priority Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Mức độ ưu tiên</label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as TodoPriority[]).map(pKey => {
                  const pCfg = PRIORITY_CONFIG[pKey];
                  const isSelected = editPriority === pKey;
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => setEditPriority(pKey)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? `${pCfg.badgeBg} border-current ring-1 ring-primary/40`
                          : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {pCfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phân loại</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORY_CONFIG) as TodoCategory[]).map(catKey => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const isSelected = editCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setEditCategory(catKey)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                        isSelected
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-primary/40`
                          : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estimated Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Thời gian dự kiến</label>
              <div className="flex gap-2">
                {[10, 15, 20, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEditEstimatedMinutes(mins)}
                    className={`flex-1 py-1 rounded-md text-xs font-semibold border transition-all ${
                      editEstimatedMinutes === mins
                        ? 'bg-primary/10 text-primary border-primary/30 ring-1 ring-primary/30'
                        : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Habit Toggle */}
            <div className="pt-2 border-t border-border/60">
              <label
                htmlFor="edit-is-daily"
                className="flex items-center gap-2 cursor-pointer font-bold text-xs text-foreground select-none"
              >
                <input
                  id="edit-is-daily"
                  type="checkbox"
                  checked={editIsDaily}
                  onChange={e => setEditIsDaily(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="flex items-center gap-1 text-primary">
                  <Repeat className="w-3.5 h-3.5" /> Lặp lại hằng ngày (Tự động reset lúc 6:00 sáng)
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTodo(null)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button type="button" onClick={saveEditedTodo} className="text-xs font-bold">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
