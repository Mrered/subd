# SubDeliver

A simple subscription aggregation API.

## 💡 What's this?

A simple subscription delivery tool.

> In order to bypass machine filters, the content below has been encoded. Please decode and read it.
> This project is a demo with many areas for improvement.

⚠️⚠️⚠️

WW91IG11c3QgdXNlIGEgbm9kZSBjb25maWd1cmF0aW9uIHN1YnNjcmlwdGlvbiBmb3IgdGhlIGBSZWFsaXR5YCBub2RlLCB3aGljaCBzaG91bGQgaW5jbHVkZSB0aGUgYHZsZXNzOi8vYCBwcm90b2NvbCBoZWFkZXIgaW4gb3JkZXIgdG8gYWNjZXNzIHRoaXMgc2VydmljZS4gSWYgeW91IGFyZSBpbnRlcmVzdGVkLCB5b3UgY2FuIGV4cGFuZCB0aGlzIHNlcnZpY2UgdG8gc3VwcG9ydCBhZGRpdGlvbmFsIHByb3RvY29scy4=

⚠️⚠️⚠️

## 📦 How to install?

### Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMrered%2Fsubd)

### Add Sensitive Environment Variables

Key | Value
--- | ---
`PRIVATE_UUID` | `username1`
`PRIVATE_CONFIG` | `https://path.to/your/private_config.yaml`
`PUBLIC_CONFIG` | `https://path.to/your/public_config.yaml`
`username1` | `UUID1`
`username2` | `UUID2`
`username3` | `UUID3`

### Link the [Vercel Postgres Database](https://vercel.com/storage/postgres)

### Create a table

```sql
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  uuid VARCHAR(255) NOT NULL,
  nodename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  UNIQUE (uuid, nodename)
);
```

### Insert Data

```sql
INSERT INTO nodes (uuid, nodename, url)
VALUES
('uuid1', 'nodename1', 'https://example.com/uuid1/nodename1'),
('uuid1', 'nodename2', 'https://example.com/uuid1/nodename2'),
('uuid2', 'nodename1', 'https://example.com/uuid2/nodename1'),
('uuid2', 'nodename2', 'https://example.com/uuid2/nodename2');
```

### Connect PG to your Project

## 🚀 How to use?

> If your Vercel App URL is `https://your-app-url.vercel.app`

- To get all the subscription nodes of a user

```url
https://your-app-url.vercel.app/uuid
```

- To get some specific subscription nodes of a user

```url
https://your-app-url.vercel.app/uuid?n=nodename1+nodename2
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is [MIT](./LICENSE) licensed.
