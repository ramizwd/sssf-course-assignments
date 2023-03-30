import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';

// TODO: Add resolvers for cat
export default {
  // 1. Queries
  Query: {
    // 1.1. cats
    cats: async () => {
      return await catModel.find();
    },
    // 1.2. catById
    catById: async (_parent: undefined, args: Cat) => {
      return await catModel.findById(args.id);
    },
    // 1.3. catsByOwner
    catsByOwner: async (_parent: undefined, args: Cat) => {
      return await catModel.find({owner: args.owner});
    },
    // 1.4. catsByArea
    catsByArea: async (_parent: undefined, args: locationInput) => {
      const bounds = rectangleBounds(args.topRight, args.bottomLeft);
      return await catModel.find({
        location: {
          $geoWithin: {
            $geometry: bounds,
          },
        },
      });
    },
  },

  // 2. Mutations
  Mutation: {
    // 2.1. createCat
    createCat: async (_parent: undefined, args: Cat) => {
      const newCat = new catModel(args);
      return await newCat.save();
    },
    // 2.2. updateCat
    updateCat: async (_parent: undefined, args: Cat) => {
      return await catModel.findByIdAndUpdate(args.id, args, {new: true});
    },
    // 2.3. deleteCat
    deleteCat: async (_parent: undefined, args: Cat) => {
      return await catModel.findByIdAndDelete(args.id);
    },
  },
};
