import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FlightSearch from './pages/FlightSearch.jsx';
import HotelSearch from './pages/HotelSearch.jsx';
import HotelDetail from './pages/HotelDetail.jsx';
import PackageSearch from './pages/PackageSearch.jsx';
import PackageDetail from './pages/PackageDetail.jsx';
import DestinationList from './pages/DestinationList.jsx';
import DestinationDetail from './pages/DestinationDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import BookingHold from './pages/BookingHold.jsx';
import Payment from './pages/Payment.jsx';
import BookingConfirmation from './pages/BookingConfirmation.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminFlights from './pages/admin/AdminFlights.jsx';
import AdminHotels from './pages/admin/AdminHotels.jsx';
import AdminPackages from './pages/admin/AdminPackages.jsx';
import AdminBookings from './pages/admin/AdminBookings.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import TripPlanner from './pages/TripPlanner.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Search & inventory */}
          <Route path="/flights" element={<FlightSearch />} />
          <Route path="/hotels" element={<HotelSearch />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/packages" element={<PackageSearch />} />
          <Route path="/packages/:id" element={<PackageDetail />} />
          <Route path="/destinations" element={<DestinationList />} />
          <Route path="/destinations/:slug" element={<DestinationDetail />} />
          <Route
            path="/plan"
            element={
              <ProtectedRoute>
                <TripPlanner />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id/hold"
            element={
              <ProtectedRoute>
                <BookingHold />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id/pay"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id/confirmation"
            element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="flights" element={<AdminFlights />} />
            <Route path="hotels" element={<AdminHotels />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
