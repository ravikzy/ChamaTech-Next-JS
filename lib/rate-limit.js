// Limite em memória por processo. Em deploy com várias instâncias, trocar por
// armazenamento compartilhado (por exemplo, Redis) para manter o mesmo limite.
const buckets = new Map();

export function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    bucket = { count: 0, expiresAt: now + windowMs };
    buckets.set(key, bucket);
  }

  if (bucket.count >= maxRequests) return false;
  bucket.count += 1;

  if (buckets.size > 5000) {
    for (const [bucketKey, value] of buckets) {
      if (value.expiresAt <= now) buckets.delete(bucketKey);
    }
  }

  return true;
}
