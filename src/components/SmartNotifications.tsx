import React, { useState, useEffect } from 'react';
import { 
  Bell, BellOff, DollarSign, MapPin, TrendingDown, TrendingUp, 
  Home, MessageCircle, Calendar, Settings, X, Check, 
  AlertCircle, Info, Heart, Eye, Clock
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'price_change' | 'new_match' | 'message' | 'market_update' | 'commute_alert' | 'application_update';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
  action_url?: string;
}

interface NotificationSettings {
  price_changes: boolean;
  new_matches: boolean;
  messages: boolean;
  market_updates: boolean;
  commute_alerts: boolean;
  application_updates: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const SmartNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    price_changes: true,
    new_matches: true,
    messages: true,
    market_updates: true,
    commute_alerts: false,
    application_updates: true,
    push_notifications: true,
    email_notifications: false,
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'price' | 'matches' | 'messages'>('all');

  useEffect(() => {
    loadNotifications();
    requestNotificationPermission();
  }, []);

  const loadNotifications = async () => {
    // Mock notification data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'price_change',
        title: 'Price Drop Alert!',
        message: 'Modern Downtown Loft dropped by $200/month',
        data: {
          property_id: 'prop1',
          old_price: 3000,
          new_price: 2800,
          property_title: 'Modern Downtown Loft'
        },
        read: false,
        created_at: '2024-01-15T10:30:00Z',
        priority: 'high',
        action_url: '/property/prop1'
      },
      {
        id: '2',
        type: 'new_match',
        title: 'New Property Match!',
        message: 'Found 3 new properties that match your criteria',
        data: {
          match_count: 3,
          match_score: 92
        },
        read: false,
        created_at: '2024-01-15T09:15:00Z',
        priority: 'medium'
      },
      {
        id: '3',
        type: 'message',
        title: 'New Message',
        message: 'Sarah Chen sent you a message about the loft',
        data: {
          sender_name: 'Sarah Chen',
          property_title: 'Modern Downtown Loft',
          conversation_id: 'conv1'
        },
        read: true,
        created_at: '2024-01-15T08:45:00Z',
        priority: 'high',
        action_url: '/messages/conv1'
      },
      {
        id: '4',
        type: 'market_update',
        title: 'Weekly Market Report',
        message: 'Capitol Hill rental prices increased by 3% this week',
        data: {
          neighborhood: 'Capitol Hill',
          price_change: 3,
          trend: 'up'
        },
        read: true,
        created_at: '2024-01-14T18:00:00Z',
        priority: 'low'
      },
      {
        id: '5',
        type: 'commute_alert',
        title: 'Commute-Based Recommendation',
        message: 'Found properties with 15min commute to your workplace',
        data: {
          commute_time: 15,
          property_count: 5,
          workplace: 'Downtown Seattle'
        },
        read: false,
        created_at: '2024-01-14T16:30:00Z',
        priority: 'medium'
      }
    ];

    setNotifications(mockNotifications);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const sendPushNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: notification.id
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const updateSettings = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'price_change': return DollarSign;
      case 'new_match': return Heart;
      case 'message': return MessageCircle;
      case 'market_update': return TrendingUp;
      case 'commute_alert': return MapPin;
      case 'application_update': return Home;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread': return !notif.read;
      case 'price': return notif.type === 'price_change';
      case 'matches': return notif.type === 'new_match';
      case 'messages': return notif.type === 'message';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Bell className="w-6 h-6 text-purple-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'price', label: 'Price Changes', count: notifications.filter(n => n.type === 'price_change').length },
            { id: 'matches', label: 'Matches', count: notifications.filter(n => n.type === 'new_match').length },
            { id: 'messages', label: 'Messages', count: notifications.filter(n => n.type === 'message').length }
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setFilter(id as any)}
              className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                filter === id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filter === id ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                    notification.read ? 'border-gray-200' : 'border-purple-500'
                  } ${!notification.read ? 'bg-purple-50' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPriorityColor(notification.priority)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                          
                          {/* Notification-specific data */}
                          {notification.type === 'price_change' && (
                            <div className="mt-2 flex items-center space-x-4 text-sm">
                              <span className="text-red-600 font-medium">
                                ${notification.data.old_price.toLocaleString()} → ${notification.data.new_price.toLocaleString()}
                              </span>
                              <span className="text-green-600">
                                Save ${(notification.data.old_price - notification.data.new_price).toLocaleString()}/mo
                              </span>
                            </div>
                          )}
                          
                          {notification.type === 'new_match' && (
                            <div className="mt-2 text-sm text-purple-600 font-medium">
                              {notification.data.match_score}% compatibility score
                            </div>
                          )}
                          
                          {notification.type === 'market_update' && (
                            <div className="mt-2 flex items-center text-sm">
                              {notification.data.trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                              )}
                              <span className={notification.data.trend === 'up' ? 'text-red-600' : 'text-green-600'}>
                                {notification.data.price_change}% change in {notification.data.neighborhood}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.created_at)}
                          </span>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark as read
                            </button>
                          )}
                        </div>
                        
                        {notification.action_url && (
                          <button className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Notification Types */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Notification Types</h3>
                <div className="space-y-3">
                  {[
                    { key: 'price_changes', label: 'Price Changes', description: 'Get notified when saved properties change price' },
                    { key: 'new_matches', label: 'New Matches', description: 'Properties that match your criteria' },
                    { key: 'messages', label: 'Messages', description: 'New messages from landlords and tenants' },
                    { key: 'market_updates', label: 'Market Updates', description: 'Weekly reports on rental market trends' },
                    { key: 'commute_alerts', label: 'Commute Alerts', description: 'Properties based on your commute preferences' },
                    { key: 'application_updates', label: 'Application Updates', description: 'Status updates on your applications' }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{label}</p>
                        <p className="text-sm text-gray-600">{description}</p>
                      </div>
                      <label className="ml-4 relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[key as keyof NotificationSettings] as boolean}
                          onChange={(e) => updateSettings(key as keyof NotificationSettings, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Methods */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Delivery Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Push Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.push_notifications}
                        onChange={(e) => updateSettings('push_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Email Notifications</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications}
                        onChange={(e) => updateSettings('email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quiet Hours</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Enable Quiet Hours</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.quiet_hours.enabled}
                        onChange={(e) => updateSettings('quiet_hours', { ...settings.quiet_hours, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  {settings.quiet_hours.enabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={settings.quiet_hours.start}
                          onChange={(e) => updateSettings('quiet_hours', { ...settings.quiet_hours, start: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">End Time</label>
                        <input
                          type="time"
                          value={settings.quiet_hours.end}
                          onChange={(e) => updateSettings('quiet_hours', { ...settings.quiet_hours, end: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors mt-6"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartNotifications;