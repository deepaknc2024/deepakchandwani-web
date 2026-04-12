import { createHash } from 'crypto';
console.log(createHash('sha256').update('bse2026').digest('hex'));
