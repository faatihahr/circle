import Joi from 'joi';

export const createCommentSchema = Joi.object({
  thread_id: Joi.number().integer().required(),
  user_id: Joi.number().integer().required(),
  image: Joi.string().optional(),
  content: Joi.string().required(),
});

export const updateCommentSchema = Joi.object({
  image: Joi.string().optional(),
  content: Joi.string().optional(),
});

export interface IComment {
  id: number;
  user_id: number;
  thread_id: number;
  image?: string;
  content: string;
  created_at: Date;
  created_by: number;
  updated_at: Date;
  updated_by: number;
}

export interface ICreateComment {
  thread_id: number;
  user_id: number;
  image?: string;
  content: string;
}

export interface IUpdateComment {
  image?: string;
  content?: string;
}
