import mongoose from 'mongoose';
import {User} from '../../interfaces/User';

const userModel = new mongoose.Schema<User>({
  user_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: true,
  },
});

userModel.virtual('id').get(function () {
  return this._id.toHexString();
});

userModel.set('toJSON', {
  virtuals: true,
});

export default mongoose.model<User>('User', userModel);
