import React, { useState } from 'react';
import { Sparkles, Target, Compass, MessageSquare, Plus, ChevronRight, Activity } from 'lucide-react';

export const AICoachView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'coaching' | 'woop' | 'decomposition' | 'chat'>('coaching');

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Coach Dashboard</h1>
              <p className="text-sm text-slate-500 font-medium">Your personalized behavior-change growth engine</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="col-span-1 flex flex-col space-y-2">
          <NavButton 
            active={activeTab === 'coaching'} 
            onClick={() => setActiveTab('coaching')}
            icon={<Activity className="w-5 h-5" />}
            label="Weekly Reflection"
          />
          <NavButton 
            active={activeTab === 'decomposition'} 
            onClick={() => setActiveTab('decomposition')}
            icon={<Target className="w-5 h-5" />}
            label="Goal Decomposition"
          />
          <NavButton 
            active={activeTab === 'woop'} 
            onClick={() => setActiveTab('woop')}
            icon={<Compass className="w-5 h-5" />}
            label="WOOP Goal Setting"
          />
          <NavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
            icon={<MessageSquare className="w-5 h-5" />}
            label="Coach Chat"
          />
        </aside>

        {/* Content Area */}
        <section className="col-span-1 md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
          {activeTab === 'coaching' && <WeeklyReflectionTab />}
          {activeTab === 'decomposition' && <GoalDecompositionTab />}
          {activeTab === 'woop' && <WOOPTab />}
          {activeTab === 'chat' && <ChatTab />}
        </section>

      </main>
    </div>
  );
};

// Sub-components

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-lg font-medium transition-colors duration-200 text-left ${
      active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const WeeklyReflectionTab = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div>
      <h2 className="text-xl font-bold text-slate-900">Weekly Reflection</h2>
      <p className="text-slate-500 mt-1">Review your patterns and celebrate progress, autonomously.</p>
    </div>
    
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
      <h3 className="font-semibold text-emerald-800 flex items-center"><Sparkles className="w-4 h-4 mr-2"/> Celebrations</h3>
      <ul className="mt-3 space-y-2 text-emerald-700 text-sm">
        <li>✓ You completed all 3 high-priority health tasks this week.</li>
        <li>✓ The "Morning Routine" habit streak is maintained for 5 days.</li>
      </ul>
    </div>

    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <h3 className="font-semibold text-amber-800">Observed Patterns</h3>
      <p className="mt-2 text-sm text-amber-700">
        You might notice that "Finance" category tasks tend to linger past their due dates. What if you tried scheduling them right after your morning coffee?
      </p>
    </div>

    <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">
      Generate Fresh Insights
    </button>
  </div>
);

const GoalDecompositionTab = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div>
      <h2 className="text-xl font-bold text-slate-900">Goal Decomposition</h2>
      <p className="text-slate-500 mt-1">Turn vague ambitions into tiny, actionable habits.</p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">What's your goal?</label>
        <textarea 
          className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
          rows={3}
          placeholder="e.g., Get healthier and run a 5k..."
        ></textarea>
      </div>
      <button className="flex items-center justify-center space-x-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">
        <Target className="w-4 h-4" />
        <span>Decompose using Tiny Habits</span>
      </button>
    </div>

    <div className="mt-8 border-t border-slate-100 pt-6">
      <h3 className="font-semibold text-slate-800 mb-4">Suggested First Action:</h3>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start space-x-4">
        <div className="bg-indigo-100 p-2 rounded-full mt-1">
          <ChevronRight className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900">Put running shoes by the door</h4>
          <p className="text-sm text-slate-600 mt-1">Implementation Intention: When I get home from work, then I will place my shoes by the front door.</p>
          <span className="inline-block mt-3 text-xs font-medium bg-slate-200 text-slate-700 px-2 py-1 rounded-full">Est: 2 mins</span>
        </div>
      </div>
    </div>
  </div>
);

const WOOPTab = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div>
      <h2 className="text-xl font-bold text-slate-900">WOOP Goal Setting</h2>
      <p className="text-slate-500 mt-1">Wish, Outcome, Obstacle, Plan. Grounded in mental contrasting research.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h3 className="font-bold text-blue-800 mb-2">Wish</h3>
        <p className="text-sm text-blue-600">What do you want to accomplish?</p>
        <input type="text" className="mt-2 w-full p-2 rounded border border-blue-200 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g., Finish the redesign spec" />
      </div>
      
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
        <h3 className="font-bold text-purple-800 mb-2">Outcome</h3>
        <p className="text-sm text-purple-600">What's the best possible result?</p>
        <input type="text" className="mt-2 w-full p-2 rounded border border-purple-200 text-sm focus:outline-none focus:border-purple-400" placeholder="e.g., Team alignment and clear next steps" />
      </div>

      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
        <h3 className="font-bold text-orange-800 mb-2">Obstacle</h3>
        <p className="text-sm text-orange-600">What internal barrier holds you back?</p>
        <input type="text" className="mt-2 w-full p-2 rounded border border-orange-200 text-sm focus:outline-none focus:border-orange-400" placeholder="e.g., I get distracted by slack" />
      </div>

      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
        <h3 className="font-bold text-emerald-800 mb-2">Plan</h3>
        <p className="text-sm text-emerald-600">If [Obstacle], then I will...</p>
        <input type="text" className="mt-2 w-full p-2 rounded border border-emerald-200 text-sm focus:outline-none focus:border-emerald-400" placeholder="e.g., Close slack for 1 hour" />
      </div>
    </div>
    
    <div className="flex justify-end pt-4">
      <button className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-sm">
        <Plus className="w-4 h-4" />
        <span>Save WOOP Plan</span>
      </button>
    </div>
  </div>
);

const ChatTab = () => {
  const [showHistory, setShowHistory] = useState(true);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Coach Chat</h2>
          <p className="text-slate-500 mt-1">Talk through blocks in a guilt-free, autonomy-supportive space.</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-[400px]">
        {/* Chat History Menu */}
        {showHistory && (
          <div className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col">
            <h3 className="font-semibold text-slate-700 mb-3 px-2 text-sm uppercase tracking-wider">Past Conversations</h3>
            <div className="space-y-1 overflow-y-auto">
              <button className="w-full text-left px-3 py-2 text-sm bg-indigo-50 text-indigo-700 font-medium rounded-lg">
                Today: Deep work focus
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors">
                Yesterday: Project planning
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors">
                Last Week: Habit check-in
              </button>
            </div>
            <button className="mt-auto w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg flex items-center justify-center space-x-1 border border-dashed border-indigo-200">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>
        )}

        {/* Active Chat */}
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col">
          <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2">
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-600 p-2 rounded-full flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm text-sm text-slate-800 max-w-[85%] leading-relaxed">
                Hi! I'm here to help you move forward. What's one thing you'd like to make progress on today?
              </div>
            </div>
            {/* User message example */}
            <div className="flex items-start justify-end">
              <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm text-sm max-w-[85%] leading-relaxed">
                I'm struggling to start my deep work block.
              </div>
            </div>
          </div>
          
          <div className="relative mt-auto">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="w-full bg-white border border-slate-300 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoachView;
