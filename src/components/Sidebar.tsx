import React, { useState, useEffect } from 'react';
import { Category, Space, Task, CustomFilter } from '../types';
import { Plus, Trash2, Filter, ChevronDown, ChevronRight, Sparkles, Sliders, X } from 'lucide-react';

interface SidebarProps {
  categories: Category[];
  spaces: Space[];
  tasks: Task[];
  customFilters: CustomFilter[];
  activeCategoryIds: string[]; // multi-select categories
  activeSpaceIds: string[]; // multi-select spaces
  activeCustomFilterId: string | null;
  onSelectCategories: (ids: string[]) => void;
  onSelectSpaces: (ids: string[]) => void;
  onSelectCustomFilter: (id: string | null) => void;
  onAddCategory: (title: string, parentId: string | null) => void;
  onDeleteCategory: (id: string) => void;
  onAddSpace: (title: string, parentId: string | null) => void;
  onDeleteSpace: (id: string) => void;
  onAddCustomFilter: (filter: Omit<CustomFilter, 'id'>) => void;
  onDeleteCustomFilter: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropOnCategory: (e: React.DragEvent, categoryId: string) => void;
  onDropOnSpace: (e: React.DragEvent, spaceId: string) => void;
  onDropOnAutoSpace: (e: React.DragEvent, autoSpaceId: string) => void;
  isMobile: boolean;
  onMobileClose?: () => void;
}

export function isColorDark(hex: string): boolean {
  if (!hex) return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 130;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 130;
  }
  return false;
}

export default function Sidebar({
  categories,
  spaces,
  tasks,
  customFilters,
  activeCategoryIds,
  activeSpaceIds,
  activeCustomFilterId,
  onSelectCategories,
  onSelectSpaces,
  onSelectCustomFilter,
  onAddCategory,
  onDeleteCategory,
  onAddSpace,
  onDeleteSpace,
  onAddCustomFilter,
  onDeleteCustomFilter,
  onDragOver,
  onDropOnCategory,
  onDropOnSpace,
  onDropOnAutoSpace,
  isMobile,
  onMobileClose,
}: SidebarProps) {
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);

  const [newSpaceTitle, setNewSpaceTitle] = useState('');
  const [newSpaceParentId, setNewSpaceParentId] = useState<string | null>(null);
  const [showAddSpace, setShowAddSpace] = useState(false);

  // Custom Filter form
  const [showCustomFilterCreator, setShowCustomFilterCreator] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [filterDurationMin, setFilterDurationMin] = useState<number | null>(null);
  const [filterDurationMax, setFilterDurationMax] = useState<number | null>(null);
  const [filterHasDueDate, setFilterHasDueDate] = useState<boolean | null>(null);

  // Subtree collapses
  const [collapsedCategories, setCollapsedCategories] = useState<{ [id: string]: boolean }>({});
  const [collapsedSpaces, setCollapsedSpaces] = useState<{ [id: string]: boolean }>({});

  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  const toggleCatCollapse = (id: string) => {
    setCollapsedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSpaceCollapse = (id: string) => {
    setCollapsedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Add category
  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;
    onAddCategory(newCatTitle.trim(), newCatParentId);
    setNewCatTitle('');
    setNewCatParentId(null);
    setShowAddCat(false);
  };

  // Add space
  const handleCreateSpaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceTitle.trim()) return;
    onAddSpace(newSpaceTitle.trim(), newSpaceParentId);
    setNewSpaceTitle('');
    setNewSpaceParentId(null);
    setShowAddSpace(false);
  };

  // "Add space" or "Show" buttons in Custom Filters
  const handleCreateCustomFilter = (e: React.FormEvent, isSave: boolean) => {
    e.preventDefault();
    if (!filterName.trim() && isSave) return;

    const filterObj = {
      name: filterName.trim() || 'Temporary Filter',
      categoryIds: filterCats,
      spaceIds: [],
      minDuration: filterDurationMin,
      maxDuration: filterDurationMax,
      hasDueDate: filterHasDueDate,
      isOverdue: null,
    };

    if (isSave) {
      onAddCustomFilter(filterObj);
      setFilterName('');
      setFilterCats([]);
      setFilterDurationMin(null);
      setFilterDurationMax(null);
      setFilterHasDueDate(null);
      setShowCustomFilterCreator(false);
    } else {
      // Temporary "Show" applying without persisting
      onSelectCustomFilter({
        id: 'temp-filter-id',
        ...filterObj,
      } as any);
      if (isMobile && onMobileClose) onMobileClose();
    }
  };

  // Click selectors handling Ctrl/Shift multi-select
  const handleCategoryClick = (catId: string | null, e: React.MouseEvent) => {
    if (catId === null) {
      onSelectCategories([]);
      if (isMobile && onMobileClose) onMobileClose();
      return;
    }

    const isMulti = e.ctrlKey || e.shiftKey || e.metaKey;
    if (isMulti) {
      if (activeCategoryIds.includes(catId)) {
        onSelectCategories(activeCategoryIds.filter(id => id !== catId));
      } else {
        onSelectCategories([...activeCategoryIds, catId]);
      }
    } else {
      onSelectCategories([catId]);
      if (isMobile && onMobileClose) onMobileClose();
    }
  };

  const handleSpaceClick = (spaceId: string, e: React.MouseEvent) => {
    const isMulti = e.ctrlKey || e.shiftKey || e.metaKey;
    if (isMulti) {
      if (activeSpaceIds.includes(spaceId)) {
        onSelectSpaces(activeSpaceIds.filter(id => id !== spaceId));
      } else {
        onSelectSpaces([...activeSpaceIds, spaceId]);
      }
    } else {
      onSelectSpaces([spaceId]);
      if (isMobile && onMobileClose) onMobileClose();
    }
  };

  // Filter out sub-elements for roots
  const rootCategories = categories.filter(c => !c.parentId);
  const rootSpaces = spaces.filter(s => !s.parentId);

  // Render tree item for category
  const renderCategoryNode = (cat: Category, depth = 0) => {
    const children = categories.filter(c => c.parentId === cat.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedCategories[cat.id];
    const isSelected = activeCategoryIds.includes(cat.id);
    const isDragHovered = hoveredTargetId === `cat-${cat.id}`;
    
    const darkText = isColorDark(cat.color);
    const activeStyle = isSelected
      ? 'bg-black text-white border-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
      : 'hover:bg-amber-50 text-gray-800 border-transparent';

    return (
      <div key={cat.id} className="select-none">
        <div
          id={`sidebar-cat-item-${cat.id}`}
          style={{ paddingLeft: `${depth * 8 + 4}px` }}
          onDragOver={e => {
            onDragOver(e);
            setHoveredTargetId(`cat-${cat.id}`);
          }}
          onDragLeave={() => setHoveredTargetId(null)}
          onDrop={e => {
            setHoveredTargetId(null);
            onDropOnCategory(e, cat.id);
          }}
          onClick={(e) => handleCategoryClick(cat.id, e)}
          className={`flex items-center justify-between group py-0.5 px-1 rounded-lg border text-xs cursor-pointer transition-all ${activeStyle} ${
            isDragHovered ? 'bg-pink-100 border-dashed border-pink-500' : ''
          }`}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCatCollapse(cat.id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded shrink-0"
              >
                {isCollapsed ? <ChevronRight className="w-3 h-3 text-black" /> : <ChevronDown className="w-3 h-3 text-black" />}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span
              className="px-1 text-[10px] rounded-md border font-mono shrink-0"
              style={{
                backgroundColor: cat.color,
                color: darkText ? '#FFFFFF' : '#000000',
                borderColor: '#000000',
              }}
            >
              {cat.emoji}
            </span>
            <span className="truncate font-sans font-medium">{cat.title}</span>
          </div>

          <div className="hidden group-hover:flex items-center shrink-0">
            <button
              id={`delete-cat-${cat.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete category "${cat.title}"?`)) onDeleteCategory(cat.id);
              }}
              className="p-0.5 hover:text-red-600 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="space-y-0.5 mt-0.5 border-l border-dashed border-gray-300 ml-2">
            {children.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render tree item for space
  const renderSpaceNode = (space: Space, depth = 0) => {
    const children = spaces.filter(s => s.parentId === space.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedSpaces[space.id];
    const isSelected = activeSpaceIds.includes(space.id);
    const isDragHovered = hoveredTargetId === `space-${space.id}`;

    const activeStyle = isSelected
      ? 'bg-[#2B95FF] text-white border-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
      : 'hover:bg-gray-100 text-gray-800 border-transparent';

    return (
      <div key={space.id} className="select-none">
        <div
          id={`sidebar-space-item-${space.id}`}
          style={{ paddingLeft: `${depth * 8 + 4}px` }}
          onDragOver={e => {
            onDragOver(e);
            setHoveredTargetId(`space-${space.id}`);
          }}
          onDragLeave={() => setHoveredTargetId(null)}
          onDrop={e => {
            setHoveredTargetId(null);
            if (space.isAutomatic) {
              onDropOnAutoSpace(e, space.id);
            } else {
              onDropOnSpace(e, space.id);
            }
          }}
          onClick={(e) => handleSpaceClick(space.id, e)}
          className={`flex items-center justify-between group py-0.5 px-1 rounded-lg border text-xs cursor-pointer transition-all ${activeStyle} ${
            isDragHovered ? 'bg-pink-100 border-dashed border-pink-500' : ''
          }`}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSpaceCollapse(space.id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded shrink-0"
              >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="text-sm shrink-0">{space.emoji}</span>
            <span className="truncate font-sans font-medium">{space.title}</span>
          </div>

          <div className="hidden group-hover:flex items-center shrink-0">
            {!space.isAutomatic && (
              <button
                id={`delete-space-${space.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete space "${space.title}"?`)) onDeleteSpace(space.id);
                }}
                className="p-0.5 hover:text-red-600 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="space-y-0.5 mt-0.5 border-l border-dashed border-gray-300 ml-2">
            {children.map(child => renderSpaceNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 select-none" id="main-sidebar-panel">
      
      {/* 1. CATEGORIES */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-comic text-sm text-black tracking-wide uppercase">Categories</h3>
          <button
            id="toggle-add-cat-btn"
            onClick={() => setShowAddCat(!showAddCat)}
            className="p-0.5 comic-border bg-yellow-200 hover:bg-yellow-300 rounded-md cursor-pointer"
          >
            <Plus className="w-3 h-3 text-black" />
          </button>
        </div>

        {showAddCat && (
          <form onSubmit={handleCreateCategorySubmit} className="bg-yellow-50 p-2 comic-border rounded-xl mb-2 animate-comic-pop">
            <input
              id="sidebar-new-cat-title"
              type="text"
              placeholder="Name..."
              value={newCatTitle}
              onChange={e => setNewCatTitle(e.target.value)}
              className="w-full p-1 text-[11px] border border-black rounded-lg bg-white mb-1 focus:outline-none"
            />
            <select
              id="sidebar-new-cat-parent"
              value={newCatParentId || ''}
              onChange={e => setNewCatParentId(e.target.value ? e.target.value : null)}
              className="w-full p-1 text-[10px] border border-black rounded-lg bg-white mb-1.5 focus:outline-none"
            >
              <option value="">No Parent (Root Category)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.title}
                </option>
              ))}
            </select>
            <div className="flex gap-1 justify-end">
              <button
                type="submit"
                className="text-[10px] px-1.5 py-0.5 bg-yellow-300 border border-black font-bold rounded-lg"
              >
                Add
              </button>
            </div>
          </form>
        )}

        <div className="space-y-0.5">
          <div
            id="sidebar-cat-all"
            onClick={(e) => handleCategoryClick(null, e)}
            className={`py-0.5 px-1 rounded-lg cursor-pointer text-xs font-sans flex items-center gap-1 border border-transparent ${
              activeCategoryIds.length === 0
                ? 'bg-black text-white border-black font-bold'
                : 'hover:bg-amber-50 text-gray-800'
            }`}
          >
            <span>🌈</span>
            <span className="font-semibold">All Categories</span>
          </div>
          {rootCategories.map(cat => renderCategoryNode(cat))}
        </div>
      </div>

      {/* 2. SPACES */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-comic text-sm text-black tracking-wide uppercase">Spaces</h3>
          <button
            id="toggle-add-space-btn"
            onClick={() => setShowAddSpace(!showAddSpace)}
            className="p-0.5 comic-border bg-yellow-200 hover:bg-yellow-300 rounded-md cursor-pointer"
          >
            <Plus className="w-3 h-3 text-black" />
          </button>
        </div>

        {showAddSpace && (
          <form onSubmit={handleCreateSpaceSubmit} className="bg-blue-50 p-2 comic-border rounded-xl mb-2 animate-comic-pop">
            <input
              id="sidebar-new-space-title"
              type="text"
              placeholder="Name..."
              value={newSpaceTitle}
              onChange={e => setNewSpaceTitle(e.target.value)}
              className="w-full p-1 text-[11px] border border-black rounded-lg bg-white mb-1 focus:outline-none"
            />
            <select
              id="sidebar-new-space-parent"
              value={newSpaceParentId || ''}
              onChange={e => setNewSpaceParentId(e.target.value ? e.target.value : null)}
              className="w-full p-1 text-[10px] border border-black rounded-lg bg-white mb-1.5 focus:outline-none"
            >
              <option value="">No Parent (Root Space)</option>
              {spaces.filter(s => !s.isAutomatic).map(s => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.title}
                </option>
              ))}
            </select>
            <div className="flex gap-1 justify-end">
              <button
                type="submit"
                className="text-[10px] px-1.5 py-0.5 bg-yellow-300 border border-black font-bold rounded-lg"
              >
                Add
              </button>
            </div>
          </form>
        )}

        <div className="space-y-0.5">
          {activeSpaceIds.length > 0 && (
            <div
              id="clear-spaces-btn"
              onClick={() => onSelectSpaces([])}
              className="py-0.5 px-1 mb-1 text-[10px] text-red-600 hover:underline cursor-pointer font-bold uppercase text-right"
            >
              Clear Spaces Selections (×)
            </div>
          )}
          {rootSpaces.map(space => renderSpaceNode(space))}
        </div>
      </div>

      {/* 3. CUSTOM FILTERS */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-comic text-sm text-black tracking-wide uppercase">Custom Filters</h3>
          <button
            id="toggle-custom-filter-btn"
            onClick={() => setShowCustomFilterCreator(!showCustomFilterCreator)}
            className="p-0.5 comic-border bg-purple-200 hover:bg-purple-300 rounded-md cursor-pointer"
          >
            <Filter className="w-3 h-3 text-black" />
          </button>
        </div>

        {showCustomFilterCreator && (
          <form className="bg-purple-50 p-2 comic-border rounded-xl mb-2 animate-comic-pop text-[11px] space-y-1.5">
            <input
              id="custom-filter-name"
              type="text"
              placeholder="Name..."
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              className="w-full p-1 border border-black rounded-lg bg-white focus:outline-none"
            />
            <div>
              <span className="block font-bold text-[9px] mb-0.5 uppercase">Categories:</span>
              <div className="max-h-16 overflow-y-auto border border-black p-1 bg-white space-y-0.5 rounded-lg">
                {categories.map(c => (
                  <label key={c.id} className="flex items-center gap-1 text-[10px]">
                    <input
                      type="checkbox"
                      checked={filterCats.includes(c.id)}
                      onChange={e => {
                        setFilterCats(prev =>
                          e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                        );
                      }}
                    />
                    <span>{c.emoji} {c.title}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <span className="block font-bold text-[9px] uppercase">Min:</span>
                <input
                  type="number"
                  value={filterDurationMin || ''}
                  onChange={e => setFilterDurationMin(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-0.5 border border-black rounded-lg"
                />
              </div>
              <div>
                <span className="block font-bold text-[9px] uppercase">Max:</span>
                <input
                  type="number"
                  value={filterDurationMax || ''}
                  onChange={e => setFilterDurationMax(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-0.5 border border-black rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-1 justify-end pt-1">
              <button
                type="button"
                onClick={(e) => handleCreateCustomFilter(e, false)}
                className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 border border-black font-semibold rounded-lg"
              >
                Show
              </button>
              <button
                type="button"
                onClick={(e) => handleCreateCustomFilter(e, true)}
                className="px-1.5 py-0.5 bg-purple-300 hover:bg-purple-400 border border-black font-bold rounded-lg"
              >
                Add space
              </button>
            </div>
          </form>
        )}

        <div className="space-y-0.5">
          <div
            id="custom-filter-all"
            onClick={() => {
              onSelectCustomFilter(null);
              if (isMobile && onMobileClose) onMobileClose();
            }}
            className={`py-0.5 px-1 rounded-lg cursor-pointer text-xs font-sans flex items-center gap-1 border border-transparent ${
              activeCustomFilterId === null
                ? 'bg-[#FFDE00] text-black border-black font-bold'
                : 'hover:bg-amber-50 text-gray-800'
            }`}
          >
            <span>📂</span>
            <span className="font-semibold">No Custom Filter</span>
          </div>
          {customFilters.map(cf => (
            <div
              key={cf.id}
              className={`flex items-center justify-between group py-0.5 px-1 rounded-lg cursor-pointer text-xs border border-transparent ${
                activeCustomFilterId === cf.id
                  ? 'bg-purple-600 text-white border-black font-bold'
                  : 'hover:bg-purple-50 text-gray-800'
              }`}
              onClick={() => {
                onSelectCustomFilter(cf.id);
                if (isMobile && onMobileClose) onMobileClose();
              }}
            >
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                <span className="truncate font-sans font-semibold">{cf.name}</span>
              </div>
              <button
                id={`delete-custom-filter-${cf.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete custom filter "${cf.name}"?`)) onDeleteCustomFilter(cf.id);
                }}
                className="hidden group-hover:block p-0.5 text-red-500 rounded shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
