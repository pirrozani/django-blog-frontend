import type { components } from './schema';

type Schemas = components['schemas'];

export type Account = Schemas['Account'];
export type AuthTokenRequest = Schemas['AuthTokenRequest'];
export type Token = Schemas['Token'];
export type Health = Schemas['Health'];

export type AuthorSummary = Schemas['AuthorSummary'];
export type Blog = Schemas['Blog'];
export type BlogRequest = Schemas['BlogRequest'];
export type PatchedBlogRequest = Schemas['PatchedBlogRequest'];

export type User = Schemas['User'];
