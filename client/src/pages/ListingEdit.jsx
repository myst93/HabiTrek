import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function ListingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, showFlash } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    country: '',
    category: 'Trending',
  });
  const [existingImage, setExistingImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // AI Writer state
  const [aiNotes, setAiNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch current listing data
  useEffect(() => {
    api.get(`/listings/${id}`)
      .then((res) => {
        const listing = res.data.listing;
        // Verify owner is current user
        if (currentUser && listing.owner && listing.owner._id !== currentUser._id) {
          showFlash('error', 'You do not have permission to edit this listing.');
          navigate(`/listings/${id}`);
          return;
        }
        setForm({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price || '',
          location: listing.location || '',
          country: listing.country || '',
          category: listing.category || 'Trending',
        });
        setExistingImage(listing.image?.url || listing.image || '');
        setLoading(false);
      })
      .catch((err) => {
        showFlash('error', err.message);
        navigate('/listings');
      });
  }, [id, currentUser, navigate, showFlash]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('location', form.location);
      data.append('country', form.country);
      data.append('category', form.category);
      if (imageFile) {
        data.append('image', imageFile);
      }

      const res = await api.put(`/listings/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showFlash('success', res.data.message || 'Listing updated!');
      navigate(`/listings/${id}`);
    } catch (err) {
      showFlash('error', err.message);
      setSubmitting(false);
    }
  };

  const handleAiEnhance = async () => {
    if (!aiNotes.trim()) {
      showFlash('error', 'Please provide some quick notes about your property.');
      return;
    }
    if (!form.location.trim()) {
      showFlash('error', 'Please specify a location first so the AI has geographical context.');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/ai/enhance', {
        notes: aiNotes,
        location: form.location,
        currentCategory: form.category
      });
      const { title, description, category } = res.data;
      setForm(prev => ({
        ...prev,
        title: title || prev.title,
        description: description || prev.description,
        category: category || prev.category
      }));
      showFlash('success', 'Title, description & category updated by AI!');
    } catch (err) {
      showFlash('error', err.message || 'AI writer failed');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="form-page" id="edit-listing-form">
      <h2>Edit Listing</h2>

      {/* AI Writer Section */}
      <div className="ai-generator-panel" id="ai-writer-section">
        <h4><i className="fa-solid fa-wand-magic-sparkles"></i> AI Listing Writer</h4>
        <p className="ai-helper-text" style={{ marginBottom: '0.5rem' }}>
          Provide raw details (e.g. amenities, vibe) & enter a <b>Location</b> in the form first, then click below:
        </p>
        <textarea
          className="ai-notes-input"
          placeholder="E.g., modern mountain dome with glass ceiling, fireplace, hot tub, ideal for stargazing, close to skiing..."
          value={aiNotes}
          onChange={(e) => setAiNotes(e.target.value)}
          id="ai-notes-input"
        />
        <button
          type="button"
          className="btn-ai"
          onClick={handleAiEnhance}
          disabled={generating}
          id="btn-ai-enhance"
        >
          {generating ? 'Generating description…' : '✨ Generate Title & Description'}
        </button>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            className="form-control"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        {existingImage && (
          <div className="form-group">
            <label>Current Listing Image</label>
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <img
                src={existingImage}
                alt="Current listing"
                style={{ width: '200px', borderRadius: '8px', objectFit: 'cover', height: '120px' }}
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="image">Upload New Image</label>
          <input
            id="image"
            name="image"
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price / night (₹)</label>
            <input
              id="price"
              name="price"
              type="number"
              className="form-control"
              value={form.price}
              onChange={handleChange}
              required
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              className="form-control"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="country">Country</label>
          <input
            id="country"
            name="country"
            type="text"
            className="form-control"
            value={form.country}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            className="form-control"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="Trending">Trending</option>
            <option value="Rooms">Rooms</option>
            <option value="Iconic Cities">Iconic Cities</option>
            <option value="Mountains">Mountains</option>
            <option value="Castles">Castles</option>
            <option value="Amazing Pools">Amazing Pools</option>
            <option value="Camping">Camping</option>
            <option value="Farms">Farms</option>
            <option value="Arctic">Arctic</option>
            <option value="Domes">Domes</option>
            <option value="Boats">Boats</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          id="btn-edit-listing-submit"
          disabled={submitting}
        >
          {submitting ? 'Saving changes…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
