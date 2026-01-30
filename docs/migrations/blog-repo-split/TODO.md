# Migration TODOs

## Preparation
- [ ] Confirm target repo names and ownership
- [ ] Freeze new blog creation during migration window
- [ ] Complete inventory (Phase 0)

## Hub repo
- [ ] Add `data/blogs.json`
- [ ] Add manifest validator script
- [ ] Add CI workflow to validate manifest
- [ ] Update title pages to use manifest links

## New blogs repo
- [ ] Create repo scaffold
- [ ] Add `blog.json` template to each blog
- [ ] Add build workflows per blog

## Pilot blog
- [ ] Select low-risk blog
- [ ] Migrate content and data sources
- [ ] Validate build output
- [ ] Update hub manifest link

## Remaining blogs
- [ ] Migrate medium complexity blogs
- [ ] Migrate high complexity blogs
- [ ] Update MIGRATION_STATUS.md for each blog

## Cleanup
- [ ] Remove migrated assets from hub
- [ ] Archive old data sources
- [ ] Update docs and onboarding
