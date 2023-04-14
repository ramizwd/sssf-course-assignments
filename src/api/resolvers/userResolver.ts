import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';
// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object

export default {
  Cat: {
    owner: async (parent: Cat) => {
      const response = await fetch(
        `${process.env.AUTH_URL}/users/${parent.owner}`
      );
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
  },

  Query: {
    users: async () => {
      const response = await fetch(`${process.env.AUTH_URL}/users`);
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const users = (await response.json()) as User[];
      return users;
    },
    userById: async (_parent: unknown, args: {id: string}) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`);
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
    checkToken: async (
      _parent: unknown,
      _args: unknown,
      user: UserIdWithToken
    ) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/token`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const userFromAuth = (await response.json()) as User;
      return userFromAuth;
    },
  },

  Mutation: {
    login: async (
      _parent: unknown,
      args: {credentials: {username: string; password: string}}
    ) => {
      const response = await fetch(`${process.env.AUTH_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.credentials),
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const loginMessage = (await response.json()) as LoginMessageResponse;
      return loginMessage;
    },
    register: async (_parent: unknown, args: {user: User}) => {
      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.user),
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
    updateUser: async (
      _parent: unknown,
      args: {user: User},
      user: UserIdWithToken
    ) => {
      if (!user.token) {
        throw new GraphQLError('Unauthorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(args.user),
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const putUser = (await response.json()) as LoginMessageResponse;
      return putUser;
    },
    deleteUser: async (
      _parent: unknown,
      _args: unknown,
      user: UserIdWithToken
    ) => {
      if (!user.token) {
        throw new GraphQLError('Unauthorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const deleteUser = (await response.json()) as LoginMessageResponse;
      return deleteUser;
    },
    updateUserAsAdmin: async (
      _parent: unknown,
      args: {user: User},
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Unauthorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      const response = await fetch(
        `${process.env.AUTH_URL}/users/${args.user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(args.user),
        }
      );
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const putUser = (await response.json()) as LoginMessageResponse;
      return putUser;
    },
    deleteUserAsAdmin: async (
      _parent: unknown,
      args: {id: string},
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Unauthorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const deleteUser = (await response.json()) as LoginMessageResponse;
      return deleteUser;
    },
  },
};
