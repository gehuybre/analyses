# Blog Repo Split Scripts

## Config
Edit `scripts/blog_repo_split/config.json` and set:
- `hub_repo_path`
- `blogs_repo_path`
- template mappings
- blog list + copy mapping
- shared repo settings (`shared` section)

## Scaffold
Dry run:
```
python3 scripts/blog_repo_split/scaffold.py --dry-run
```

Apply changes:
```
python3 scripts/blog_repo_split/scaffold.py
```

## Shared repo setup (submodule/subtree)
Dry run:
```
python3 scripts/blog_repo_split/shared_setup.py --dry-run
```

Apply:
```
python3 scripts/blog_repo_split/shared_setup.py
```

## Sync shared files (optional one-way)
One-way sync from hub to blogs repo:
```
python3 scripts/blog_repo_split/sync_shared.py --dry-run
python3 scripts/blog_repo_split/sync_shared.py
```

## Auto sync options
- Use the shared repo as a submodule or subtree.
- Or keep using the sync script in CI for one-way mirroring.
