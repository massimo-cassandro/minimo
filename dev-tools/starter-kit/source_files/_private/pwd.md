## pwd dev
* massimo.cassandro@blu-net.it
* pwd: `devMax`
* Password hash   `$2y$13$woOLLKqTHGnCqlo8D6Iste50vipaXOn2uKPaxztUK8bfQMYPa2MXu`

```sql
INSERT INTO `utente` (`id`, `email`, `password`, `nome`, `cognome`, `roles`, `active`, `cr_timestamp`, `last_login`, `cancellato`, `export`, `um_utente_id`, `um_timestamp`)
VALUES
	(2, 'massimo.cassandro@blu-net.it', '$2y$13$woOLLKqTHGnCqlo8D6Iste50vipaXOn2uKPaxztUK8bfQMYPa2MXu', 'Massimo', 'Cassandro', '[\"ROLE_DEPLOY\"]', 1, '2026-03-30 00:00:00', '2026-07-22 09:52:57', 0, 1, 1, '2026-07-22 11:52:57')
  ON DUPLICATE KEY UPDATE
    password = '$2y$13$woOLLKqTHGnCqlo8D6Iste50vipaXOn2uKPaxztUK8bfQMYPa2MXu';
```

## genera pwd symfony

`php bin/console security:hash-password`
