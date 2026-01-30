---
kind: file
path: docs/LIBRARY-FIRST-POLICY.md
role: Reference examples for Library-First Policy
workflows: []
inputs: []
outputs: []
interfaces: []
stability: stable
owner: Unknown
safe_to_delete_when: When library policy is removed or examples are consolidated
superseded_by: null
last_reviewed: 2026-01-25
---

# Library Package Examples

This file contains short copy-pastable examples for recommended libraries used by the Library-First Policy.

## zod

```ts
import * as z from 'zod';
const QuerySchema = z.object({
  limit: z.string().optional().transform(s => Number(s) || 10),
  region: z.string().optional(),
});
const result = QuerySchema.safeParse(req.query);
if (!result.success) return res.status(400).json({ error: result.error.issues });
```

```ts
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(18, "Must be at least 18")
});
const parsed = schema.parse(data); // throws on invalid
```

## date-fns

```ts
import {format, parseISO} from 'date-fns';
const pretty = (iso) => format(parseISO(iso), 'yyyy-MM-dd');
```

```ts
import { formatDistance, subDays } from 'date-fns';
formatDistance(subDays(new Date(), 3), new Date(), { addSuffix: true });
//=> "3 days ago"
```

## lodash

```js
import _ from 'lodash';
const unique = _.uniqBy(items, 'id');
```

```js
const value = _.get(obj, 'a.b.c', 'default');
const grouped = _.groupBy(data, 'category');
```

## p-limit

```js
import pLimit from 'p-limit';
const limit = pLimit(3);
const results = await Promise.all(urls.map(u => limit(() => fetch(u))));
```

```js
const limit = pLimit(1);
const input = [
  limit(() => fetchSomething('foo')),
  limit(() => fetchSomething('bar')),
];
const result = await Promise.all(input);
```

## multer

```js
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('avatar'), (req, res) => res.send('ok'));
```
