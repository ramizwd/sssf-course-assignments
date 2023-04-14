import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import {Types} from 'mongoose';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object

export default {
  Query: {
    cats: async () => {
      return await catModel.find();
    },
    catById: async (_parent: unknown, args: Cat) => {
      return await catModel.findById(args.id);
    },
    catsByOwner: async (_parent: unknown, args: Cat) => {
      return await catModel.find({owner: args.owner});
    },
    catsByArea: async (_parent: unknown, args: locationInput) => {
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

  Mutation: {
    createCat: async (_parent: unknown, args: Cat, user: UserIdWithToken) => {
      if (!user.token) {
        throw new GraphQLError('You are not authorized to create a cat', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      args.owner = user.id as unknown as Types.ObjectId;
      const newCat = new catModel(args);
      return await newCat.save();
    },
    updateCat: async (_parent: unknown, args: Cat, user: UserIdWithToken) => {
      if (!user.token) {
        throw new GraphQLError('You are not authorized to update a cat', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      const cat = await catModel.findById(args.id);

      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }

      if (cat.owner.toString() !== user.id) {
        throw new GraphQLError('You are not authorized to update this cat', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      return await catModel.findByIdAndUpdate(args.id, args, {new: true});
    },
    deleteCat: async (_parent: unknown, args: Cat, user: UserIdWithToken) => {
      if (!user.token) {
        throw new GraphQLError('You are not authorized to delete a cat', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      const cat = await catModel.findById(args.id);

      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }

      if (cat.owner.toString() !== user.id) {
        throw new GraphQLError('You are not authorized to update this cat', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndDelete(args.id);
    },
    updateCatAsAdmin: async (
      _parent: unknown,
      args: Cat,
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('You are not authorized to update a cat', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      return await catModel.findByIdAndUpdate(args.id, args, {new: true});
    },
    deleteCatAsAdmin: async (
      _parent: unknown,
      args: Cat,
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('You are not authorized to delete a cat', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      if (user.role !== 'admin') {
        throw new GraphQLError('You are not authorized to delete this cat', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndDelete(args.id);
    },
  },
};
