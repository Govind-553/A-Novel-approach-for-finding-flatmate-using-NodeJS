import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  fULL_name: String,
  email: String,
  password: String,
  address: String,
  contact_number: String,
  year: String,
  branch: String,
  about_yourself: String,
  profile_pic: Buffer,
  food_type: String,
  room_type: String,
  amenities: String,
  pricing_value: String,
  landmark: String,
  github: String,
  linkedin: String,
  instagram: String,
  portfolio: String,
  food_type: String,
  room_type: String,
  cluster: Number,
  match_cluster: Number,
}, { collection: 'students' });

export default mongoose.model('Student', StudentSchema);