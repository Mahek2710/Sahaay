import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sahaay';

const resourceSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  capability: { type: String, required: true },
  status: { type: String, required: true, enum: ['Available', 'Deployed', 'Unavailable'] },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
});

const Resource = mongoose.model('Resource', resourceSchema);

const sampleResources = [
  {
    domain: 'Medical Response',
    capability: 'Mobile Medical Unit - Ambulance with paramedics',
    status: 'Available',
    location: { lat: 28.6139, lng: 77.2090 },
  },
  {
    domain: 'Fire & Rescue',
    capability: 'Fire Engine Unit - Fully equipped with rescue tools',
    status: 'Available',
    location: { lat: 28.6200, lng: 77.2200 },
  },
  {
    domain: 'Infrastructure & Utilities',
    capability: 'Power Restoration Team - Electrical repair specialists',
    status: 'Available',
    location: { lat: 28.6100, lng: 77.2000 },
  },
  {
    domain: 'Shelter & Relief',
    capability: 'Temporary Shelter Setup - Tents and supplies',
    status: 'Available',
    location: { lat: 28.6150, lng: 77.2150 },
  },
  {
    domain: 'Community Support',
    capability: 'Volunteer Coordination Center',
    status: 'Available',
    location: { lat: 28.6180, lng: 77.2120 },
  },
  {
    domain: 'Security & Control',
    capability: 'Crowd Control Unit - Trained personnel',
    status: 'Available',
    location: { lat: 28.6120, lng: 77.2050 },
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Resource.deleteMany({});
    console.log('Cleared existing resources');

    await Resource.insertMany(sampleResources);
    console.log(`Seeded ${sampleResources.length} resources`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
