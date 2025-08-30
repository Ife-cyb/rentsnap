# RentSnap - Comprehensive Real Estate Platform

A modern, feature-rich real estate platform built with React, TypeScript, and Supabase. RentSnap combines Tinder-style property discovery with advanced features for both tenants and landlords.

## 🏠 Core Features

### For Tenants
- **Tinder-Style Property Discovery**: Swipe through properties with AI-powered matching
- **Smart Filters**: Advanced filtering with budget, location, amenities, and preferences
- **Saved Properties**: Heart properties to save them for later viewing
- **Real-time Messaging**: Chat with landlords and property managers
- **Quick Apply**: Universal application system for multiple properties

### For Landlords
- **Property Management**: Add, edit, and manage property listings
- **Analytics Dashboard**: Real-time insights on property performance
- **Tenant Screening**: Background checks and verification tools
- **Virtual Showings**: Schedule and conduct live property tours

## 🌟 Advanced Features

### Social Impact & Community
- **Affordable Housing Portal**: Income-restricted listings and housing assistance programs
- **Neighborhood Insights**: Comprehensive area scoring (diversity, safety, schools, walkability)
- **Local Business Directory**: Interactive map of nearby services and amenities
- **Smart Roommate Match**: AI-powered roommate compatibility matching

### Media & Virtual Tours
- **Short-form Video Tours**: 60-90 second vertical video highlights
- **In-app Voice Communication**: Built-in audio messaging system
- **Live Virtual Showings**: Real-time video property tours with chat
- **Visual Stories**: 24-hour temporary property highlights and updates

### Smart Notifications
- **Price Change Alerts**: Instant notifications for saved property price changes
- **Commute-based Recommendations**: Properties based on work/school location
- **Market Intelligence**: Weekly automated neighborhood pricing reports
- **Application Updates**: Real-time status updates on rental applications

### Analytics & Intelligence
- **Real-time Market Data**: Interactive graphs showing rental price trends
- **Demand Metrics**: Daily viewer counts and application statistics
- **Geographic Heat Maps**: Color-coded visualization of high-demand areas
- **Investment Calculator**: ROI analysis tools for property investors

### Trust & Verification
- **Tenant History**: Verified reviews from previous landlords
- **Social Verification**: Optional social media profile integration
- **Employment Check**: Automated employment and income verification
- **Instant Screening**: One-click background and credit checks

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: Zustand
- **Animations**: React Spring, React Use Gesture
- **Icons**: Lucide React
- **Build Tool**: Vite
- **PWA**: Service Worker, Web App Manifest

## 📱 Mobile-First Design

- Responsive design optimized for mobile devices
- Touch-friendly swipe gestures
- Progressive Web App (PWA) capabilities
- Offline functionality with service workers
- Push notifications support

## 🔐 Security & Privacy

- Row Level Security (RLS) with Supabase
- Encrypted document storage
- GDPR compliant data handling
- Secure authentication with JWT tokens
- Background check integration

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rentsnap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations from `/supabase/migrations`
   - Update environment variables

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Update with your Supabase credentials
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📊 Database Schema

The platform uses a comprehensive PostgreSQL schema with the following main tables:

- `user_profiles` - User information and preferences
- `properties` - Property listings with detailed information
- `property_images` - Property photos and media
- `property_interactions` - User interactions (likes, views, saves)
- `conversations` - Messaging between users
- `messages` - Individual chat messages
- `match_scores` - AI-powered compatibility scores
- `user_preferences` - Search and matching preferences
- `property_views` - Analytics tracking
- `property_interactions` - User engagement data

## 🎯 Key Features Implementation

### AI-Powered Matching
- Calculates compatibility scores based on user preferences
- Considers budget, location, amenities, and lifestyle factors
- Real-time score updates when preferences change

### Real-time Communication
- WebSocket-based messaging system
- Voice message support with waveform visualization
- Push notifications for new messages

### Advanced Search & Filtering
- Multi-criteria search with intelligent ranking
- Saved search preferences
- Location-based filtering with radius selection

### Analytics & Insights
- Property performance tracking
- Market trend analysis
- User engagement metrics
- Revenue optimization tools

## 🔧 Development

### Code Organization
- Modular component architecture
- Custom hooks for data management
- Centralized state management with Zustand
- Type-safe API interactions with TypeScript

### Performance Optimizations
- Lazy loading of components
- Image optimization and caching
- Efficient database queries with pagination
- Service worker for offline functionality

### Testing
- Component testing with React Testing Library
- API integration tests
- End-to-end testing with Playwright

## 📈 Deployment

The application is optimized for deployment on modern hosting platforms:

- **Netlify**: Automatic deployments with build optimization
- **Vercel**: Edge functions and global CDN
- **Supabase**: Database and authentication hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Supabase for the backend infrastructure
- Tailwind CSS for the design system
- React Spring for smooth animations
- Lucide React for beautiful icons
- Pexels for stock photography

---

Built with ❤️ for the future of rental housing discovery.