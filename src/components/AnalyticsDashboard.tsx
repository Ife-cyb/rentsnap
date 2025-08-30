import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Eye, Heart, MessageCircle, DollarSign, 
  MapPin, Calendar, Users, BarChart3, PieChart, Activity, 
  Filter, Download, RefreshCw, Loader
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    total_views: number;
    total_likes: number;
    total_inquiries: number;
    avg_response_time: number;
    conversion_rate: number;
    revenue_potential: number;
  };
  trends: {
    views: { date: string; value: number }[];
    inquiries: { date: string; value: number }[];
    prices: { date: string; value: number }[];
  };
  demographics: {
    age_groups: { range: string; percentage: number }[];
    income_levels: { range: string; percentage: number }[];
    locations: { city: string; percentage: number }[];
  };
  property_performance: {
    property_id: string;
    title: string;
    views: number;
    likes: number;
    inquiries: number;
    conversion_rate: number;
    avg_time_on_page: number;
  }[];
  market_data: {
    neighborhood: string;
    avg_price: number;
    price_change: number;
    demand_score: number;
    supply_count: number;
  }[];
  heat_map_data: {
    lat: number;
    lng: number;
    intensity: number;
    price: number;
    demand: number;
  }[];
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'inquiries' | 'prices'>('views');
  const [showHeatMap, setShowHeatMap] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock analytics data - in a real app, this would come from your analytics service
      const mockData: AnalyticsData = {
        overview: {
          total_views: 12847,
          total_likes: 892,
          total_inquiries: 156,
          avg_response_time: 2.4,
          conversion_rate: 6.9,
          revenue_potential: 45600
        },
        trends: {
          views: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 500) + 200
          })),
          inquiries: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 20) + 5
          })),
          prices: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 200) + 2500
          }))
        },
        demographics: {
          age_groups: [
            { range: '18-25', percentage: 28 },
            { range: '26-35', percentage: 42 },
            { range: '36-45', percentage: 20 },
            { range: '46+', percentage: 10 }
          ],
          income_levels: [
            { range: '$30k-50k', percentage: 25 },
            { range: '$50k-75k', percentage: 35 },
            { range: '$75k-100k', percentage: 25 },
            { range: '$100k+', percentage: 15 }
          ],
          locations: [
            { city: 'Seattle', percentage: 45 },
            { city: 'Bellevue', percentage: 20 },
            { city: 'Redmond', percentage: 15 },
            { city: 'Tacoma', percentage: 12 },
            { city: 'Other', percentage: 8 }
          ]
        },
        property_performance: [
          {
            property_id: '1',
            title: 'Modern Downtown Loft',
            views: 2847,
            likes: 234,
            inquiries: 45,
            conversion_rate: 8.2,
            avg_time_on_page: 3.2
          },
          {
            property_id: '2',
            title: 'Cozy University Studio',
            views: 1923,
            likes: 156,
            inquiries: 28,
            conversion_rate: 5.8,
            avg_time_on_page: 2.8
          },
          {
            property_id: '3',
            title: 'Luxury Penthouse',
            views: 3421,
            likes: 298,
            inquiries: 67,
            conversion_rate: 9.1,
            avg_time_on_page: 4.1
          }
        ],
        market_data: [
          {
            neighborhood: 'Capitol Hill',
            avg_price: 2850,
            price_change: 3.2,
            demand_score: 92,
            supply_count: 45
          },
          {
            neighborhood: 'Belltown',
            avg_price: 3200,
            price_change: -1.5,
            demand_score: 88,
            supply_count: 32
          },
          {
            neighborhood: 'Fremont',
            avg_price: 2400,
            price_change: 5.1,
            demand_score: 76,
            supply_count: 67
          },
          {
            neighborhood: 'Queen Anne',
            avg_price: 2950,
            price_change: 2.8,
            demand_score: 84,
            supply_count: 38
          }
        ],
        heat_map_data: Array.from({ length: 50 }, () => ({
          lat: 47.6062 + (Math.random() - 0.5) * 0.1,
          lng: -122.3321 + (Math.random() - 0.5) * 0.1,
          intensity: Math.random() * 100,
          price: Math.floor(Math.random() * 2000) + 1500,
          demand: Math.floor(Math.random() * 100)
        }))
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const exportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting analytics data...');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Analytics data will appear here once you have activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={loadAnalyticsData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={exportData}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { 
              label: 'Total Views', 
              value: analyticsData.overview.total_views, 
              icon: Eye, 
              color: 'text-blue-600 bg-blue-100',
              change: '+12.5%'
            },
            { 
              label: 'Total Likes', 
              value: analyticsData.overview.total_likes, 
              icon: Heart, 
              color: 'text-red-600 bg-red-100',
              change: '+8.3%'
            },
            { 
              label: 'Inquiries', 
              value: analyticsData.overview.total_inquiries, 
              icon: MessageCircle, 
              color: 'text-green-600 bg-green-100',
              change: '+15.7%'
            },
            { 
              label: 'Response Time', 
              value: `${analyticsData.overview.avg_response_time}h`, 
              icon: Activity, 
              color: 'text-yellow-600 bg-yellow-100',
              change: '-0.5h'
            },
            { 
              label: 'Conversion Rate', 
              value: `${analyticsData.overview.conversion_rate}%`, 
              icon: TrendingUp, 
              color: 'text-purple-600 bg-purple-100',
              change: '+2.1%'
            },
            { 
              label: 'Revenue Potential', 
              value: `$${formatNumber(analyticsData.overview.revenue_potential)}`, 
              icon: DollarSign, 
              color: 'text-green-600 bg-green-100',
              change: '+$5.2K'
            }
          ].map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${
                  change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Trends</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="views">Views</option>
                <option value="inquiries">Inquiries</option>
                <option value="prices">Avg Prices</option>
              </select>
            </div>
            
            {/* Simple line chart representation */}
            <div className="h-64 flex items-end space-x-1">
              {analyticsData.trends[selectedMetric].slice(-14).map((point, index) => {
                const maxValue = Math.max(...analyticsData.trends[selectedMetric].map(p => p.value));
                const height = (point.value / maxValue) * 100;
                
                return (
                  <div
                    key={index}
                    className="flex-1 bg-purple-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${height}%` }}
                    title={`${point.date}: ${point.value}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Demographics</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Age Groups</h4>
                {analyticsData.demographics.age_groups.map(({ range, percentage }) => (
                  <div key={range} className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{range}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Income Levels</h4>
                {analyticsData.demographics.income_levels.map(({ range, percentage }) => (
                  <div key={range} className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{range}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Property Performance */}
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Property Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inquiries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.property_performance.map((property) => (
                  <tr key={property.property_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{property.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(property.views)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(property.likes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.inquiries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        property.conversion_rate > 7 
                          ? 'bg-green-100 text-green-800' 
                          : property.conversion_rate > 5 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {property.conversion_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.avg_time_on_page}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Overview */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Market Intelligence</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.market_data.map((market) => (
                  <div key={market.neighborhood} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{market.neighborhood}</h4>
                      <p className="text-sm text-gray-600">
                        ${market.avg_price.toLocaleString()}/mo • {market.supply_count} listings
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center ${
                        market.price_change > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {market.price_change > 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(market.price_change)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Demand: {market.demand_score}/100
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Heat Map */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Geographic Heat Map</h3>
                <button
                  onClick={() => setShowHeatMap(!showHeatMap)}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  {showHeatMap ? 'Hide' : 'Show'} Map
                </button>
              </div>
            </div>
            <div className="p-6">
              {showHeatMap ? (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Interactive heat map would be rendered here</p>
                    <p className="text-sm text-gray-500">Showing {analyticsData.heat_map_data.length} data points</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">High Demand Areas</span>
                    <span className="text-red-600 font-medium">🔥 Hot</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Moderate Demand</span>
                    <span className="text-yellow-600 font-medium">📈 Growing</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Low Demand</span>
                    <span className="text-blue-600 font-medium">💎 Opportunity</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Insight:</strong> Capitol Hill and Belltown show highest demand. 
                      Consider pricing strategies for these areas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;