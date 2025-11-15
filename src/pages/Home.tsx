import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Play, Settings, TvMinimal, Wifi, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [serverInfo, setServerInfo] = useState<{ ip: string; port: number } | null>(null);

  useEffect(() => {
    // Get server info
    const getServerInfo = async () => {
      if ((window as any).electronAPI) {
        const result = await (window as any).electronAPI.getServerInfo();
        if (result.success && result.data) {
          setServerInfo({ ip: result.data.ip, port: result.data.port });
        }
      }
    };
    getServerInfo();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

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

        {/* Network Scoreboard Info */}
        {serverInfo && (
          <div className="mt-12 bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Network Scoreboard URL</h3>
                  <p className="text-sm text-gray-600">Access from any device on your network</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-2xl font-mono font-bold text-blue-600">
                    http://{serverInfo.ip}:{serverInfo.port}/scoreboard
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Also available at: http://localhost:{serverInfo.port}/scoreboard
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(`http://${serverInfo.ip}:${serverInfo.port}/scoreboard`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
