# PostgreSQL integration tests

The attendance, distribution, and household smoke suites require separate, empty databases.
They insert fixture data and leave it in place. Run them against a disposable
PostgreSQL server bound to `127.0.0.1` on a non-default port. Each database
name must begin with `efas_test_`. Supply credentials through your local
environment and avoid printing the resulting database URL.

To provision the databases automatically, set `EFAS_TEST_SERVER_URL` to the
local server's `postgres` maintenance database URL and run, from `backend`,
`pipenv run python -m tests.run_postgresql_smoke`. The account needs permission
to create databases. The runner gives each fixture a unique name and leaves
the databases available for inspection. It stops if either migration or suite
fails. Use a disposable server so fixture databases can be removed with it.

For each suite, create a new empty database and set `DATABASE_URL` and
`EFAS_TEST_DATABASE_URL` to its PostgreSQL URL. From `backend`, run
`pipenv run flask --app app db upgrade` and then one of these commands.

```text
pipenv run python -m tests.postgresql_attendance_smoke
pipenv run python -m tests.postgresql_distribution_smoke
pipenv run python -m tests.postgresql_household_smoke
```

Use a fresh database for the second command. The tests reject a non-loopback
host, the default PostgreSQL port, URL query parameters, and database names
without the fixture prefix. The attendance suite also exercises migration
downgrade and upgrade on its fixture. Run the normal backend suite with
`pipenv run test` separately.

PostGIS integration and automated provisioning remain part of TEST-002.

For spatial checks, enable PostGIS in a separate fresh fixture database,
run migrations, and run `pipenv run python -m tests.postgis_center_smoke`.
The database must meet the same loopback, port and name restrictions.
Alternatively, set `EFAS_TEST_POSTGIS=1` when running the fixture runner. Its
database owner must have permission to create the installed PostGIS extension.
