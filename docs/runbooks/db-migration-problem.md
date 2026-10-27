# Migration problem
1. Migrations are forward-only. Write a corrective migration; never edit production from the dashboard.
2. Use expand/contract: add columns first, deploy code, remove old columns later.
3. PITR restore is the last resort: restore to a NEW project, verify, then cut over.
