import Joi from 'joi';

export const createPostSchema = Joi.object({
  image: Joi.string().optional(),
  content: Joi.string().required(),
});

export const updatePostSchema = Joi.object({
  image: Joi.string().optional(),
  content: Joi.string().optional(),
});

export interface IPost {
  id: number;
  user_id: number;
  image?: string;
  content: string;
  created_at: Date;
  created_by: number;
  updated_at: Date;
  updated_by: number;
}

export interface ICreatePost {
  image?: string;
  content: string;
}

export interface IUpdatePost {
  image?: string;
  content?: string;
}
