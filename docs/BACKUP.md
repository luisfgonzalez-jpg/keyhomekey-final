# Sistema de Backups

## Backup Manual
```bash
npm run backup
```

## Restaurar Backup
```bash
npm run backup:restore 2024-01-15
```

## Backups Automáticos
- Se ejecutan diariamente a las 2 AM UTC
- Se guardan en GitHub Actions Artifacts por 30 días
- Se eliminan automáticamente backups locales mayores a 30 días

## Descargar Backup de GitHub Actions
1. Ir a Actions → Daily Database Backup
2. Seleccionar la ejecución deseada
3. Descargar artifact "database-backup-XXX"
