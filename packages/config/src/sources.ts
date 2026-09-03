import { readFileSync } from "node:fs";

import yaml from "js-yaml";
import { z } from "zod";

const sourceCategorySchema = z.object({
  url: z.string().url({ message: "must be a valid URL" }),
  brand: z.string().min(1, { message: "must be a non-empty string" }),
});

const sourceEntrySchema = z.object({
  id: z.string().min(1, { message: "must be a non-empty string" }),
  base_url: z.string().url({ message: "must be a valid URL" }),
  rate_limit_rps: z.number().positive({ message: "must be a positive number" }),
  categories: z
    .array(sourceCategorySchema)
    .min(1, { message: "must contain at least one category" }),
});

const sourcesRegistrySchema = z
  .object({
    sources: z
      .array(sourceEntrySchema)
      .min(1, { message: "must contain at least one source" }),
  })
  .superRefine((data, ctx) => {
    const seenIds = new Set<string>();
    for (let index = 0; index < data.sources.length; index += 1) {
      const id = data.sources[index].id;
      if (seenIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate id "${id}"`,
          path: ["sources", index, "id"],
        });
      }
      seenIds.add(id);
    }
  });

export type SourceCategory = z.infer<typeof sourceCategorySchema>;
export type SourceEntry = z.infer<typeof sourceEntrySchema>;
export type SourcesRegistry = z.infer<typeof sourcesRegistrySchema>;

function formatZodPath(path: (string | number)[]): string {
  let result = "";
  for (const segment of path) {
    if (typeof segment === "number") {
      result += `[${segment}]`;
    } else {
      result += result ? `.${segment}` : segment;
    }
  }
  return result;
}

function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = formatZodPath(issue.path);
  return `sources.yaml: ${path}: ${issue.message}`;
}

export function parseSourcesRegistry(
  content: string,
  options?: { knownBrands?: ReadonlySet<string> },
): SourcesRegistry {
  const parsed = yaml.load(content);

  if (parsed === undefined || parsed === null) {
    throw new Error("sources.yaml: config is empty");
  }

  const result = sourcesRegistrySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(formatZodError(result.error));
  }

  if (options?.knownBrands) {
    for (let sourceIndex = 0; sourceIndex < result.data.sources.length; sourceIndex += 1) {
      const source = result.data.sources[sourceIndex];
      for (
        let categoryIndex = 0;
        categoryIndex < source.categories.length;
        categoryIndex += 1
      ) {
        const brand = source.categories[categoryIndex].brand;
        if (!options.knownBrands.has(brand)) {
          throw new Error(
            `sources.yaml: sources[${sourceIndex}].categories[${categoryIndex}].brand: unknown brand "${brand}" (not in brands.yaml)`,
          );
        }
      }
    }
  }

  return result.data;
}

export function loadSourcesRegistry(
  configPath: string,
  options?: { knownBrands?: ReadonlySet<string> },
): SourcesRegistry {
  const content = readFileSync(configPath, "utf8");
  return parseSourcesRegistry(content, options);
}
