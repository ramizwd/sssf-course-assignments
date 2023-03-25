// TODO: cat interface
import {Document, Types} from 'mongoose';
import {Point} from 'geojson';
import {User} from './User';

interface Cat extends Document {
  cat_name: string;
  weight: number;
  filename: string;
  birthdate: Date;
  location: Point;
  owner: Types.ObjectId | User;
}

interface CatTest {
  _id?: string;
  cat_name?: string;
  weight?: number;
  filename?: string;
  birthdate?: Date;
  location?: Point;
  owner?: Types.ObjectId | User;
}

export {Cat, CatTest};
