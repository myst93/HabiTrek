const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to clean JSON string if wrapped in markdown blocks
function cleanJSONString(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/```$/, '');
  }
  return cleaned.trim();
}

// ─── AI Concierge Chat ────────────────────────────────────────────────────────
module.exports.chatConcierge = async (req, res) => {
  const { listing, messages = [], query } = req.body;

  if (!listing || !query) {
    return res.status(400).json({ error: 'Missing listing context or user query.' });
  }

  // Graceful fallback if GEMINI_API_KEY is not configured
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'fallback-secret-change-me') {
    console.warn('⚠️ GEMINI_API_KEY not configured. Using mock fallback responses.');

    // Simulate a smart localized travel response
    const mockAnswer = generateMockConciergeResponse(listing, query);
    return res.json({ response: mockAnswer, isMock: true });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const systemInstruction = `You are a helpful and local concierge/travel guide for a property listed on HabiTrek (an Airbnb-like site).
The property details are:
- Title: ${listing.title}
- Location: ${listing.location}, ${listing.country}
- Description: ${listing.description || 'No description provided.'}
- Price per night: ₹${listing.price || 'N/A'}
- Category: ${listing.category || 'Trending'}

Use this information to answer travel-related questions for a potential guest or guest staying at this listing. 
Suggest local highlights, itineraries, food, packing lists, transit tips, or house FAQs. 
Be warm, friendly, and concise. Keep responses formatted with markdown, using bullet points where helpful. 
Respond directly in a conversation style.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction,
    });

    // Format chat history for Gemini SDK
    // SDK expects role: 'user' | 'model', parts: [{ text: "..." }]
    const history = [];
    // Only take the last 10 messages to save context limits
    let messageHistory = messages.slice(-10);
    // Remove the current query if it was appended to the message array
    if (messageHistory.length > 0 && messageHistory[messageHistory.length - 1].content === query) {
      messageHistory = messageHistory.slice(0, -1);
    }
    for (const msg of messageHistory) {
      if (msg.role === 'user' || msg.role === 'model') {
        // Skip leading model messages (e.g. the initial welcome message)
        // since Gemini SDK requires the first history entry to be from the 'user'
        if (history.length === 0 && msg.role === 'model') {
          continue;
        }
        history.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      }
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(query);
    const responseText = result.response.text();

    return res.json({ response: responseText, isMock: false });
  } catch (error) {
    console.error('❌ Gemini Chat Error:', error);
    // Graceful error fallback
    const mockAnswer = generateMockConciergeResponse(listing, query);
    return res.json({
      response: `*(Note: The AI service encountered an issue, but here is a simulated tip for your trip)*\n\n${mockAnswer}`,
      isMock: true,
    });
  }
};

// ─── AI Listing Description Enhancer ──────────────────────────────────────────
module.exports.enhanceListing = async (req, res) => {
  const { notes, location, currentCategory = 'Trending' } = req.body;

  if (!notes || !location) {
    return res.status(400).json({ error: 'Please provide some notes and a location.' });
  }

  // Graceful fallback if GEMINI_API_KEY is not configured
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'fallback-secret-change-me') {
    console.warn('⚠️ GEMINI_API_KEY not configured. Using mock fallback for enhancer.');
    const mockOutput = generateMockEnhancement(notes, location, currentCategory);
    return res.json({ ...mockOutput, isMock: true });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const categoriesList = ['Trending', 'Rooms', 'Iconic Cities', 'Mountains', 'Castles', 'Amazing Pools', 'Camping', 'Farms', 'Arctic', 'Domes', 'Boats'];

    const prompt = `You are an expert real estate copywriter. Given a property location and some raw notes from the owner, you will generate:
1. A catchy, high-converting listing title (max 50 chars).
2. A detailed, engaging, and professional description highlighting potential attractions, comfort, and benefits of staying there.
3. Suggest the single best category for this listing from the following exact categories: ${categoriesList.join(', ')}.

Input Location: ${location}
Input Notes: ${notes}

Return your output ONLY as a valid JSON object with the exact keys: "title", "description", and "category".`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = cleanJSONString(text);
    const parsedData = JSON.parse(cleanedText);

    return res.json({
      title: parsedData.title || '',
      description: parsedData.description || '',
      category: parsedData.category || currentCategory,
      isMock: false,
    });
  } catch (error) {
    console.error('❌ Gemini Enhance Error:', error);
    const mockOutput = generateMockEnhancement(notes, location, currentCategory);
    return res.json({
      ...mockOutput,
      isMock: true,
      note: 'Fallback generated due to service error.'
    });
  }
};

// ─── Fallback Generators ──────────────────────────────────────────────────────

function generateMockConciergeResponse(listing, query) {
  const q = query.toLowerCase().trim();
  const title = listing.title || 'this property';
  const loc = (listing.location || '').trim();
  const locLower = loc.toLowerCase();

  // Keyword check for itinerary/roaming/explore, including common user typos
  const isItinerary = q.includes('itinerary') || q.includes('iternary') || q.includes('iteranry') || q.includes('itinerry') || q.includes('plan') || q.includes('day') || q.includes('roam') || q.includes('spot') || q.includes('visit') || q.includes('sight') || q.includes('explore') || q.includes('place') || q.includes('location') || q.includes('activity') || q.includes('attraction') || q.includes('view') || q.includes('go to') || q.includes('see');

  const isFood = q.includes('eat') || q.includes('food') || q.includes('restaurant') || q.includes('cafe') || q.includes('dining') || q.includes('breakfast') || q.includes('lunch') || q.includes('dinner') || q.includes('cuisine') || q.includes('specialty') || q.includes('drink');

  const isPacking = q.includes('pack') || q.includes('wear') || q.includes('clothing') || q.includes('bring') || q.includes('bag') || q.includes('weather') || q.includes('climate') || q.includes('temperature');

  if (isItinerary) {
    let localDetails = '';
    if (locLower.includes('aspen')) {
      localDetails = `### 🏔️ Roaming Spots & Highlights in Aspen
* **Maroon Bells**: Iconic twin peaks reflecting in Maroon Lake (stunning hikes & views!).
* **Aspen Mountain**: Perfect for world-class skiing in winter or scenic gondola rides in summer.
* **Cathedral Lake Trail**: A premium, moderate-to-challenging alpine lake hike.
* **Downtown Aspen**: Explore chic boutiques, art galleries, and historic buildings.`;
    } else if (locLower.includes('malibu')) {
      localDetails = `### 🌊 Roaming Spots & Highlights in Malibu
* **Malibu Pier**: Stroll the historic pier, watch surfers, and enjoy fresh seafood.
* **Zuma Beach**: Expansive sandy beach famous for clean water and dolphin sightings.
* **Point Dume**: Cliffside hikes overlooking a nature preserve and ocean views.
* **Getty Villa**: A beautiful Roman-style museum showcasing ancient arts.`;
    } else if (locLower.includes('manali')) {
      localDetails = `### 🏔️ Roaming Spots & Highlights in Manali
* **Solang Valley**: Famous for adventure sports like paragliding, quad biking, and skiing.
* **Rohtang Pass**: Breathtaking snow-covered pass offering panoramic mountain vistas.
* **Hadimba Temple**: Ancient wooden temple nestled in dense cedar forest.
* **Old Manali**: Charming alleys lined with unique cafes, live music, and shops.`;
    } else if (locLower.includes('goa')) {
      localDetails = `### 🌴 Roaming Spots & Highlights in Goa
* **Fort Aguada**: 17th-century Portuguese fort and lighthouse with sweeping sea views.
* **Calangute & Baga Beaches**: Energetic beachfronts with water sports and beach shacks.
* **Dudhsagar Falls**: Majestic four-tiered waterfall surrounded by lush jungle.
* **Anjuna Flea Market**: Famous bohemian shopping and vibrant local street vibe.`;
    } else {
      localDetails = `### 📍 Local Highlights in ${loc || 'this area'}
* **Sightseeing Center**: Explore popular monuments, historic landmarks, and plazas.
* **Nature Outing**: Head to the nearest park, lakeside trail, or scenic viewpoint.
* **Art & Culture**: Visit regional galleries, craft markets, and theaters.`;
    }

    return `Here is a custom recommendation for your stay at **${title}** in **${loc || 'this area'}**!

${localDetails}

### 📅 Suggested 3-Day Plan
* **Day 1: Get Settled & Local Stroll**
  Check-in, relax, and explore the immediate neighborhood. Catch dinner at a cozy spot.
* **Day 2: Outdoor Exploration**
  Dedicate the day to visiting the top highlights listed above (hiking, beaches, or sightseeing).
* **Day 3: Leisure & Shopping**
  Browse local shops, purchase souvenirs, try local food street-style, and watch the sunset!`;
  }

  if (isFood) {
    let localFood = '';
    if (locLower.includes('aspen')) {
      localFood = `* **White House Tavern**: Legendary sandwiches and cocktails in a cozy historic cabin.
* **Bear Den Aspen**: Artisanal bakery and cafe serving organic, local breakfast and lunch.
* **Element 47**: Upscale alpine dining featuring fine wines and curated local ingredients.`;
    } else if (locLower.includes('malibu')) {
      localFood = `* **Malibu Farm Restaurant**: Fresh, farm-to-table dining located directly on the pier.
* **Broad Street Oyster Co.**: Famous for rich, warm lobster rolls and fresh oysters.
* **Nobu Malibu**: Iconic oceanfront dining known for world-class sushi and celebrity sightings.`;
    } else if (locLower.includes('manali')) {
      localFood = `* **Cafe 1947**: Old Manali's first music cafe, set right next to the flowing Beas River.
* **Johnson's Cafe**: Renowned for local wood-fired trout fish specialties and live music.
* **Drifters' Cafe**: Cozy spot offering great breakfast, board games, and relaxing vibes.`;
    } else {
      localFood = `* **The Local Tavern**: Famous for authentic, traditional food and a welcoming family atmosphere.
* **Sun & Soil Cafe**: Perfect spot for breakfast, freshly roasted coffee, and pastries.
* **Starlight Grill**: A fantastic dinner option featuring fresh ingredients and scenic outdoor seating.`;
    }

    return `### 🍽️ Top Dining Recommendations near ${loc || 'the property'}
Here are some of the best cafes and restaurants to try during your stay:

${localFood}

*Tip: Be sure to reserve a table in advance for popular weekend dinner slots!*`;
  }

  if (isPacking) {
    let localPacking = '';
    if (locLower.includes('aspen') || locLower.includes('manali')) {
      localPacking = `* **Warm Layers**: Thermal underwear, heavy fleece/sweaters, and a windproof jacket.
* **Sturdy Boots**: Insulated, waterproof boots with good grip for walking on snow or trails.
* **Sun & Lip Protection**: High altitude sun is strong; bring UV sunglasses and SPF lip balm.`;
    } else if (locLower.includes('malibu') || locLower.includes('goa')) {
      localPacking = `* **Beach Essentials**: Swimwear, quick-dry towels, and a wide-brimmed sunhat.
* **Breathable Clothes**: Lightweight cotton shirts, linen pants, and shorts.
* **UV Sunscreen & Sandals**: Polarized sunglasses, SPF 50+ sunscreen, and comfortable flip-flops.`;
    } else {
      localPacking = `* **Comfortable Footwear**: Essential for walking around and exploring local spots.
* **Weather-appropriate Layers**: Temperatures can fluctuate, so bring a light jacket or sweater.
* **Camera & Chargers**: You'll definitely want to capture the scenic charm of ${title}!`;
    }

    return `### 🎒 Packing Essentials for your trip to ${loc || 'this destination'}
Make sure you pack the following items:

${localPacking}

*Safe travels! Let me know if you need any other help.*`;
  }

  // Conversational response if user is just greeting or chatting
  return `Hi! I'm your AI Concierge for **${title}** in beautiful **${loc || 'our location'}**. 😊

I can help you plan the perfect trip! Ask me about:
* **"Tell me about the itinerary, roaming spots and landmarks"**
* **"Where should I eat nearby?"**
* **"What is the weather like / what should I pack?"**

*(Tip: To enable full, unrestricted conversational AI responses, please add your \`GEMINI_API_KEY\` to the server's \`.env\` file!)*`;
}

function generateMockEnhancement(notes, location, currentCategory) {
  // Simple heuristics to categorize
  const lowerNotes = notes.toLowerCase();
  let category = currentCategory;
  if (lowerNotes.includes('pool') || lowerNotes.includes('swim')) category = 'Amazing Pools';
  else if (lowerNotes.includes('mountain') || lowerNotes.includes('hill')) category = 'Mountains';
  else if (lowerNotes.includes('camp') || lowerNotes.includes('tent')) category = 'Camping';
  else if (lowerNotes.includes('farm') || lowerNotes.includes('green')) category = 'Farms';
  else if (lowerNotes.includes('boat') || lowerNotes.includes('water') || lowerNotes.includes('lake')) category = 'Boats';
  else if (lowerNotes.includes('castle') || lowerNotes.includes('palace')) category = 'Castles';
  else if (lowerNotes.includes('dome') || lowerNotes.includes('igloo')) category = 'Domes';
  else if (lowerNotes.includes('room') || lowerNotes.includes('flat')) category = 'Rooms';
  else if (lowerNotes.includes('city') || lowerNotes.includes('town')) category = 'Iconic Cities';

  const generatedTitle = `Stunning Escape in ${location}`;
  const generatedDesc = `Welcome to our unique retreat located in the heart of ${location}. 

Highlights based on details:
- Cozy atmosphere and beautiful surroundings.
- Features: ${notes}.
- Quiet, safe neighborhood perfect for relaxing.

Whether you're visiting for business or a memorable vacation, this property has everything you need for a comfortable stay. We look forward to hosting you!`;

  return {
    title: generatedTitle,
    description: generatedDesc,
    category: category,
  };
}
