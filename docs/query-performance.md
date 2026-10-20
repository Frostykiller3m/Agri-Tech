# Query performance checks

Run these in `mongosh` against the target database after indexes have finished building. Replace the example ObjectIds with real IDs when relevant. Capture `executionStats` before and after index changes and compare `totalKeysExamined`, `totalDocsExamined`, `nReturned`, and execution time. For ordinary list queries, look for an `IXSCAN`, no blocking `SORT`, and examined-document counts close to returned-document counts. Small development collections may legitimately use a collection scan; re-check with production-like data before changing an index.

## 1. Farm list by owner

Matches `farmService.listFarms`, including its newest-first sort:

```javascript
db.farms
  .find(
    { owner: ObjectId('64b000000000000000000001') },
    {
      owner: 1,
      name: 1,
      location: 1,
      district: 1,
      state: 1,
      areaInAcres: 1,
      soilType: 1,
      irrigationType: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  )
  .sort({ createdAt: -1 })
  .limit(20)
  .explain('executionStats');
```

Expected index: `{ owner: 1, createdAt: -1 }`.

## 2. Resource catalogue by status/category

Matches the common approved catalogue filter. The API's substring search uses escaped regular expressions to preserve current search behavior; that part is not accelerated by the text index. The text index is available for a future explicit full-text search mode.

```javascript
db.resources
  .find(
    { status: 'approved', category: 'seed' },
    {
      name: 1,
      category: 1,
      description: 1,
      price: 1,
      stock: 1,
      unit: 1,
      imageUrl: 1,
      status: 1,
      createdBy: 1,
      createdAt: 1,
    },
  )
  .sort({ createdAt: -1 })
  .limit(12)
  .explain('executionStats');
```

Expected indexes: `{ status: 1, category: 1, createdAt: -1 }` and the resource text index on `name`/`description` for `$text` queries.

## 3. Order list by customer/status

Matches a farmer's orders, with the optional status filter shown:

```javascript
db.orders
  .find({ user: ObjectId('64b000000000000000000001'), status: 'placed' })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain('executionStats');
```

Expected index for farmer lists: `{ user: 1, createdAt: -1 }`. Admin status-filtered lists can use `{ status: 1, createdAt: -1 }`.

## 4. Consultation inbox

Matches the expert inbox (farmers see their own records; admins may filter by status):

```javascript
db.consultations
  .find({ status: 'open' })
  .sort({ updatedAt: -1 })
  .limit(20)
  .explain('executionStats');
```

Expected indexes: `{ status: 1, updatedAt: -1 }` for the expert inbox and `{ farmer: 1, updatedAt: -1 }` when sorting an individual farmer's list.

## 5. Visible forum posts

Matches the default newest-first forum feed:

```javascript
db.posts
  .find({ isHidden: false, category: 'soil' })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain('executionStats');
```

Expected index: `{ isHidden: 1, category: 1, createdAt: -1 }`. The post text index covers `title` and `body` for `$text` queries; the current list endpoint does not perform a text search.

Indexes are declared in the Mongoose schemas. For a production deployment, confirm index creation is enabled and completed before judging list-query plans. Avoid enabling automatic index builds on a large production database without planning their resource impact.
