import { z } from 'zod';

/**
 * Search-related schemas from OpenAPI spec
 */

// Search Meta
export const SearchMetaDtoSchema = z.object({
  query: z.string(),
  count: z.number(),
  projectId: z.string().uuid().optional(),
});

export type SearchMetaDto = z.infer<typeof SearchMetaDtoSchema>;

// Search Projects Response
export const SearchProjectsResponseSchema = z.object({
  data: z.array(z.any()),
  meta: SearchMetaDtoSchema,
});

export type SearchProjectsResponse = z.infer<typeof SearchProjectsResponseSchema>;

// Search Tasks Response
export const SearchTasksResponseSchema = z.object({
  data: z.array(z.any()),
  meta: SearchMetaDtoSchema,
});

export type SearchTasksResponse = z.infer<typeof SearchTasksResponseSchema>;
