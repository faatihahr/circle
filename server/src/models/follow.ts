import Joi from 'joi';

export const followSchema = Joi.object({
  // No body needed, data from URL and user
});

export interface IFollow {
  follower_id: number;
  following_id: number;
}

export interface IFollowData {
  id: number;
  follower_id: number;
  following_id: number;
  created_at: Date;
  updated_at: Date;
  follower: {
    id: number;
    username: string;
    name: string;
    profilePicture: string;
  };
  following: {
    id: number;
    username: string;
    name: string;
    profilePicture: string;
  };
}
