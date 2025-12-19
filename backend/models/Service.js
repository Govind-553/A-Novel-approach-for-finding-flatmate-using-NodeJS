import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  business_Name: String,
  email: String,
  password: String,
  address: String,
  contact_number: String,
  service: String,
  price_chart_link: String,
  room_type: String,
  amenities: String,
  food_type: String,
  laundry_service: String,
  pricing_value: String,
  landmark: String,
  cluster: Number,
  availability: String
}, { collection: 'services' });

export default mongoose.model('Service', ServiceSchema);