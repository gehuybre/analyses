# Proposed Repo Structure

## Hub repo (this repo)
```
/content-hub
  /pages
    /titles
      index.md
      ...
  /data
    blogs.json
  /scripts
    validate-blogs.ts
  /.github/workflows
    validate-blogs.yml
```

### Notes
- `data/blogs.json` is the source of truth for links and metadata.
- Title pages can be generated from the manifest or manually maintained.

## Blogs repo (new)
```
/blogs
  /blog-a
    /content
    /data-sources
    /build
    /assets
    /scripts
    blog.json
  /blog-b
    ...
  /.github/workflows
    build-blog-a.yml
    build-blog-b.yml
```

### Notes
- Each blog folder is self-contained and can build independently.
- `blog.json` stores metadata and build hints for each blog.
