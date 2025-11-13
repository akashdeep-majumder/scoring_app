import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Play, Settings, TvMinimal } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: Trophy,
      title: 'Tournaments',
      description: 'Create and manage tournaments',
      path: '/tournaments',
      color: 'bg-blue-500',
    },
    {
      icon: Users,
      title: 'Teams',
      description: 'Manage teams and lineups',
      path: '/teams',
      color: 'bg-green-500',
    },
    {
      icon: Play,
      title: 'Start Match',
      description: 'Begin a new match',
      path: '/match-setup',
      color: 'bg-red-500',
    },
    {
      icon: TvMinimal,
      title: 'Scoreboard Display',
      description: 'View scoreboard for TV',
      path: '/scoreboard',
      color: 'bg-purple-500',
    },
    {
      icon: Settings,
      title: 'Ads & Settings',
      description: 'Manage advertisements',
      path: '/settings',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Cricket Scoring App
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            Professional cricket scoring and display system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {item.title}
                </h2>
                <p className="text-gray-600">{item.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
