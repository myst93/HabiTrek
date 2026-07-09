import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FlashMessage from './components/FlashMessage';
import ListingsIndex from './pages/ListingsIndex';
import ListingShow from './pages/ListingShow';
import ListingNew from './pages/ListingNew';
import ListingEdit from './pages/ListingEdit';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookingsList from './pages/BookingsList';
import WishlistList from './pages/WishlistList';
import UserProfile from './pages/UserProfile';

export default function App() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <FlashMessage />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<ListingsIndex />} />
          <Route path="/listings" element={<ListingsIndex />} />
          <Route path="/listings/new" element={<ListingNew />} />
          <Route path="/listings/:id" element={<ListingShow />} />
          <Route path="/listings/:id/edit" element={<ListingEdit />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/wishlist" element={<WishlistList />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
