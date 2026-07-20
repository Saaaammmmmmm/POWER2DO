import React from 'react';
import { AppSettings, Space, Category } from '../types';
import { Settings, Sliders, Palette, Clock, LogOut, LayoutGrid, Type, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  settings: AppSettings;
  categories: Category[];
  availableSpaces: Space[];
  currentUserEmail: string;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onToggleAuthPage: () => void;
}

export default function SettingsPanel({
  settings,
  categories,
  availableSpaces,
  currentUserEmail,
  onUpdateSettings,
  onToggleAuthPage,
}: SettingsPanelProps) {
  
  const handleDayChangeTimeSelect = (val: string) => {
    onUpdateSettings({
      ...settings,
      dayChangeTime: val,
    });
  };

  const handleToggleAutoSpace = (spaceId: string) => {
    const active = [...settings.automaticSpaces];
    const index = active.indexOf(spaceId);
    if (index > -1) {
      active.splice(index, 1);
    } else {
      active.push(spaceId);
    }
    onUpdateSettings({
      ...settings,
      automaticSpaces: active,
    });
  };

  const handleThemeColorSelect = (primaryHex: string, accentHex: string) => {
    onUpdateSettings({
      ...settings,
      theme: {
        ...settings.theme,
        primaryColor: primaryHex,
        accentColor: accentHex,
      }
    });
  };

  const handleToggleHalftone = () => {
    onUpdateSettings({
      ...settings,
      theme: {
        ...settings.theme,
        halftoneEnabled: !settings.theme.halftoneEnabled,
      }
    });
  };

  const handleToggleColorMapping = (key: 'categoryColorEnabled' | 'spaceColorEnabled' | 'progressColorEnabled') => {
    onUpdateSettings({
      ...settings,
      theme: {
        ...settings.theme,
        colorMappings: {
          ...settings.theme.colorMappings,
          [key]: !settings.theme.colorMappings[key],
        }
      }
    });
  };

  const handleUpdateValue = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  const comicColorDuos = [
    { name: 'Classic Pop', primary: '#FFDE4D', accent: '#FF007F' }, // Yellow & Pink
    { name: 'Cosmic Retro', primary: '#38BDF8', accent: '#A78BFA' }, // Cyan & Purple
    { name: 'Acid Punch', primary: '#4ADE80', accent: '#F472B6' }, // Lime Green & Pink
    { name: 'Inky Gold', primary: '#FACC15', accent: '#000000' }, // Gold & Black
    { name: 'Sunset Riot', primary: '#FB923C', accent: '#EF4444' }, // Orange & Red
  ];

  return (
    <div id="settings-panel-container" className="bg-white border-4 border-black p-5 md:p-6 rounded-none relative">
      
      {/* Settings Header */}
      <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-black animate-spin" style={{ animationDuration: '6s' }} />
          <h2 className="font-comic text-2xl md:text-3xl tracking-wider text-black uppercase">
            POWER SETTINGS
          </h2>
        </div>
        <div className="bg-yellow-300 text-black border-2 border-black font-bold text-xs px-2 py-0.5 rounded-md rotate-1">
          CUSTOM CONTROL PANEL
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* LEFT COLUMN: VISUAL PARAMETERS & DEFAULTS */}
        <div className="space-y-6">
          
          {/* Creator Display Settings (Customizable compactness & sizes) */}
          <div className="bg-amber-50 border-2 border-black p-4 rounded-none space-y-3">
            <h3 className="font-comic text-base text-black flex items-center gap-1.5 border-b border-black pb-2 uppercase">
              <Type className="w-4 h-4 text-amber-600" />
              Creator Size & Spacing
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[10px] uppercase mb-1">Form Compactness:</label>
                <select
                  id="settings-compactness"
                  value={settings.creatorCompactness || 'normal'}
                  onChange={e => handleUpdateValue('creatorCompactness', e.target.value as any)}
                  className="w-full bg-white border-2 border-black p-1.5 font-bold focus:outline-none"
                >
                  <option value="normal">Normal Spacing (Standard)</option>
                  <option value="compact">Compact Spacing (Reduced)</option>
                  <option value="tiny">Tiny Spacing (Minimalist)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[10px] uppercase mb-1">Form Font Size:</label>
                <select
                  id="settings-font-size"
                  value={settings.creatorFontSize || 'sm'}
                  onChange={e => handleUpdateValue('creatorFontSize', e.target.value as any)}
                  className="w-full bg-white border-2 border-black p-1.5 font-bold focus:outline-none"
                >
                  <option value="xs">Tiny Text (xs)</option>
                  <option value="sm">Small Text (sm)</option>
                  <option value="base">Regular Text (base)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase mb-1">Category Min Font Size (Long Names):</label>
              <input
                id="settings-min-font-size"
                type="number"
                min={8}
                max={16}
                value={settings.minFontSize || 10}
                onChange={e => handleUpdateValue('minFontSize', parseInt(e.target.value) || 10)}
                className="w-full bg-white border-2 border-black p-1.5 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Mission Defaults Selector */}
          <div className="bg-blue-50/50 border-2 border-black p-4 rounded-none space-y-3">
            <h3 className="font-comic text-base text-black flex items-center gap-1.5 border-b border-black pb-2 uppercase">
              <Sliders className="w-4 h-4 text-blue-600" />
              Mission Creation Defaults
            </h3>

            <div>
              <label className="block font-bold text-[10px] uppercase mb-1">Default Category:</label>
              <select
                id="settings-default-category"
                value={settings.defaultCategory || 'cat-personal'}
                onChange={e => handleUpdateValue('defaultCategory', e.target.value)}
                className="w-full bg-white border-2 border-black p-1.5 font-bold focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[10px] uppercase mb-1">Default Duration (m):</label>
                <input
                  id="settings-default-duration"
                  type="number"
                  value={settings.defaultDuration || 45}
                  onChange={e => handleUpdateValue('defaultDuration', parseInt(e.target.value) || 45)}
                  className="w-full bg-white border-2 border-black p-1.5 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] uppercase mb-1">Default Repeat:</label>
                <select
                  id="settings-default-repeat"
                  value={settings.defaultRepeat || 'none'}
                  onChange={e => handleUpdateValue('defaultRepeat', e.target.value as any)}
                  className="w-full bg-white border-2 border-black p-1.5 font-bold focus:outline-none"
                >
                  <option value="none">None (Single Time)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[10px] uppercase mb-1">Default Start Time (e.g., "10:00" or empty):</label>
              <input
                id="settings-default-starttime"
                type="text"
                placeholder="HH:MM (24h format)"
                value={settings.defaultStartTime || ''}
                onChange={e => handleUpdateValue('defaultStartTime', e.target.value)}
                className="w-full bg-white border-2 border-black p-1.5 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Calendar Duration Scale Multiplier (Timeblindness assistance) */}
          <div className="bg-purple-50 border-2 border-black p-4 rounded-none space-y-3">
            <h3 className="font-comic text-base text-black flex items-center gap-1.5 border-b border-black pb-2 uppercase">
              <Clock className="w-4 h-4 text-purple-600" />
              Calendar Time Scale
            </h3>
            <p className="text-[10px] font-semibold text-gray-700 leading-relaxed">
              Adjust the <strong>Timeblindness Scale Factor</strong>. High scale factors render long duration missions taller on the weekly grid, helping visualize heavy schedules easily!
            </p>
            <div className="flex gap-2 items-center">
              <input
                id="settings-timeblind-multiplier"
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={settings.timeblindMultiplier || 2.5}
                onChange={e => handleUpdateValue('timeblindMultiplier', parseFloat(e.target.value) || 2.5)}
                className="flex-1 accent-black"
              />
              <span className="font-mono font-black text-xs bg-yellow-200 border-2 border-black px-2 py-0.5 rounded-md">
                {settings.timeblindMultiplier || 2.5}x scale
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: THEMES, DYNAMIC SHADOWS, ACCOUNT */}
        <div className="space-y-6">
          
          {/* Dynamic Columns Configuration */}
          <div className="bg-emerald-50 border-2 border-black p-4 rounded-none space-y-3">
            <h3 className="font-comic text-base text-black flex items-center gap-1.5 border-b border-black pb-2 uppercase">
              <LayoutGrid className="w-4 h-4 text-emerald-600" />
              Configure List Columns & Order
            </h3>
            <p className="text-[10px] text-gray-700 leading-relaxed font-semibold">
              Select which details are visible in the List view and click arrows to reorder their sequence!
            </p>
            <div className="space-y-1 bg-white border-2 border-black p-2 rounded-none max-h-48 overflow-y-auto">
              {['name', 'category', 'doDate', 'dueDate', 'startTime', 'duration'].map((colKey, index) => {
                const isActive = settings.listColumns.includes(colKey);
                const colLabel = {
                  name: 'Mission Name (Name)',
                  category: 'Category Tag',
                  doDate: 'Plan Target Date (Do)',
                  dueDate: 'Strict Deadline (Due)',
                  startTime: 'Start Time Slot',
                  duration: 'Expected Duration'
                }[colKey] || colKey;

                // Move up/down column handlers
                const handleMoveColumn = (dir: 'up' | 'down') => {
                  const currentCols = [...settings.listColumns];
                  const curIdx = currentCols.indexOf(colKey);
                  if (curIdx === -1) return; // Column is not active, can't move
                  const targetIdx = dir === 'up' ? curIdx - 1 : curIdx + 1;
                  if (targetIdx < 0 || targetIdx >= currentCols.length) return;
                  // Swap
                  const tmp = currentCols[curIdx];
                  currentCols[curIdx] = currentCols[targetIdx];
                  currentCols[targetIdx] = tmp;
                  handleUpdateValue('listColumns', currentCols);
                };

                const handleToggleColumn = (checked: boolean) => {
                  let currentCols = [...settings.listColumns];
                  if (checked) {
                    if (!currentCols.includes(colKey)) {
                      currentCols.push(colKey);
                    }
                  } else {
                    // Prevent turning off 'name' since that is required!
                    if (colKey === 'name') return;
                    currentCols = currentCols.filter(c => c !== colKey);
                  }
                  handleUpdateValue('listColumns', currentCols);
                };

                const activeIndex = settings.listColumns.indexOf(colKey);

                return (
                  <div key={colKey} className="flex items-center justify-between p-1.5 hover:bg-gray-50 border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isActive}
                        disabled={colKey === 'name'}
                        onChange={e => handleToggleColumn(e.target.checked)}
                        className="rounded border-gray-400 text-black focus:ring-0 cursor-pointer"
                      />
                      <span className={`text-[11px] truncate font-sans font-bold ${isActive ? 'text-black' : 'text-gray-400 line-through'}`}>
                        {colLabel} {isActive && <span className="text-[9px] text-purple-600 font-mono">(Pos: {activeIndex + 1})</span>}
                      </span>
                    </label>

                    {isActive && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={activeIndex === 0}
                          onClick={() => handleMoveColumn('up')}
                          className="px-1 py-0.5 bg-gray-100 border border-black hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 text-[10px] font-bold"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={activeIndex === settings.listColumns.length - 1}
                          onClick={() => handleMoveColumn('down')}
                          className="px-1 py-0.5 bg-gray-100 border border-black hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 text-[10px] font-bold"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Card Shadows Settings */}
          <div className="bg-rose-50/50 border-2 border-black p-4 rounded-none space-y-3">
            <h3 className="font-comic text-base text-black flex items-center gap-1.5 border-b border-black pb-2 uppercase">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Dynamic Mission Card Shadows
            </h3>
            
            <p className="text-[10px] font-semibold text-gray-700 leading-relaxed">
              Dynamically tint mission card shadows based on custom rules. Highly functional for scanning layouts in List View.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[10px] uppercase mb-1">Color Mode:</label>
                <select
                  id="settings-shadow-color-mode"
                  value={settings.taskShadowColorMode || 'category'}
                  onChange={e => handleUpdateValue('taskShadowColorMode', e.target.value as any)}
                  className="w-full bg-white border-2 border-black p-1.5 font-bold focus:outline-none"
                >
                  <option value="category">Category-Colored</option>
                  <option value="duration">Duration (Red=Long, Green=Short)</option>
                  <option value="urgency">Urgency (Red=Has Deadline)</option>
                  <option value="custom">Fixed Custom Tint</option>
                  <option value="none">Flat (No shadow)</option>
                </select>
              </div>

              {settings.taskShadowColorMode === 'custom' && (
                <div>
                  <label className="block font-bold text-[10px] uppercase mb-1">Custom Shadow hex:</label>
                  <div className="flex gap-1.5">
                    <input
                      type="color"
                      value={settings.taskShadowColorCustom || '#000000'}
                      onChange={e => handleUpdateValue('taskShadowColorCustom', e.target.value)}
                      className="w-8 h-8 cursor-pointer border-2 border-black p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.taskShadowColorCustom || '#000000'}
                      onChange={e => handleUpdateValue('taskShadowColorCustom', e.target.value)}
                      className="w-full bg-white border-2 border-black px-2 py-1 text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comic-Book Visual Themes */}
          <div className="bg-rose-50 border-2 border-black p-4 rounded-none space-y-4">
            <h3 className="font-comic text-base text-black flex items-center gap-1.5 border-b border-black pb-2 uppercase">
              <Palette className="w-4 h-4 text-purple-600" />
              Comic-Book Visual Theme
            </h3>

            <div>
              <span className="block font-bold text-[10px] mb-2 uppercase text-black">Color Palette presets:</span>
              <div className="grid grid-cols-2 gap-2">
                {comicColorDuos.map(duo => {
                  const isActive = settings.theme.primaryColor === duo.primary && settings.theme.accentColor === duo.accent;
                  return (
                    <button
                      key={duo.name}
                      type="button"
                      onClick={() => handleThemeColorSelect(duo.primary, duo.accent)}
                      className={`p-2 rounded-xl text-xs font-bold flex justify-between items-center border-2 border-black hover:scale-102 transition-all cursor-pointer ${
                        isActive ? 'bg-black text-white' : 'bg-white text-black'
                      }`}
                    >
                      <span>{duo.name}</span>
                      <div className="flex gap-0.5 shrink-0 ml-1.5">
                        <span className="w-3 h-3 rounded-full border border-black inline-block" style={{ backgroundColor: duo.primary }} />
                        <span className="w-3 h-3 rounded-full border border-black inline-block" style={{ backgroundColor: duo.accent }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Halftone Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-black/10">
              <span className="text-[10px] font-bold text-black uppercase">Render Halftone Dot Overlays</span>
              <button
                id="toggle-halftone-btn"
                type="button"
                onClick={handleToggleHalftone}
                className={`border-2 border-black px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                  settings.theme.halftoneEnabled ? 'bg-pink-500 text-white' : 'bg-gray-200 text-black'
                }`}
              >
                {settings.theme.halftoneEnabled ? 'DOTS: ON' : 'DOTS: OFF'}
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="bg-gray-100 border-2 border-black p-4 rounded-none flex items-center justify-between">
            <div className="min-w-0">
              <span className="block text-[9px] font-bold text-gray-500 uppercase font-mono">AUTHORIZED COGNIZANCE:</span>
              <span className="block text-xs font-bold truncate text-black font-mono">{currentUserEmail}</span>
            </div>
            <button
              id="settings-sign-out-btn"
              type="button"
              onClick={onToggleAuthPage}
              className="bg-black text-white hover:bg-pink-500 hover:text-white px-3 py-1.5 rounded-lg border-2 border-black text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Identity</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
