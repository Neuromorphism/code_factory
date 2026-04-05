import { slugify } from "./utils.js";

export function buildBranchName(title, { prefix = "factory" } = {}) {
  const slug = slugify(title) || "work-item";
  return `${prefix}/${slug}`;
}

export function assignUniqueBranchNames(items, options = {}) {
  const seen = new Map();

  return items.map((item) => {
    const baseName = buildBranchName(item.title, options);
    const count = seen.get(baseName) ?? 0;
    seen.set(baseName, count + 1);

    if (count === 0) {
      return baseName;
    }

    return `${baseName}-${count + 1}`;
  });
}
