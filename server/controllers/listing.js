const Listing = require('../models/listing.js');

// GET /api/listings — return all listings
module.exports.index = async (req, res) => {
  const allListing = await Listing.find({});
  res.json({ listings: allListing });
};

// GET /api/listings/:id — return a single listing with reviews & owner
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: 'review', populate: { path: 'author' } })
    .populate('owner');
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }
  res.json({ listing });
};

// POST /api/listings — create a new listing
module.exports.createListing = async (req, res) => {
  let url = '';
  let filename = '';
  if (req.file) {
    if (req.file.path.startsWith('http://') || req.file.path.startsWith('https://')) {
      url = req.file.path;
    } else {
      url = `http://localhost:${process.env.PORT || 8080}/uploads/${req.file.filename}`;
    }
    filename = req.file.filename || '';
  }
  const newListing = new Listing(req.body);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  await newListing.save();
  res.status(201).json({ message: 'New listing created!', listing: newListing });
};

// PUT /api/listings/:id — update a listing
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, req.body, { new: true });
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }
  if (req.file) {
    let url = '';
    if (req.file.path.startsWith('http://') || req.file.path.startsWith('https://')) {
      url = req.file.path;
    } else {
      url = `http://localhost:${process.env.PORT || 8080}/uploads/${req.file.filename}`;
    }
    listing.image = { url, filename: req.file.filename || '' };
    await listing.save();
  }
  res.json({ message: 'Listing updated!', listing });
};

// DELETE /api/listings/:id — delete a listing
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.json({ message: 'Listing deleted!' });
};
