# Update Version

Reads the version stored in `package.json`, updates it, and maintains a log file.

Each update adds a line to the `changelog.md` file located at the project root. Each line contains the date, the updated version, and optionally, a descriptive text.

The updated version number and descriptive text are copied to the clipboard to speed up commenting for any subsequent commits.

Usage:

```bash
npx update-version <options>
```

Options:

* `--pkg`: Path to the `package.json` file relative to the current directory (default: `./package.json`)
* `--log-file`: Path to the log file relative to the current directory (default: `./changelog.md`). If the file name ends with `.txt`, the log type is assumed to be the previous version of `update-version`, where each line is in the form `timestamp | version | description`
* `--log-patch`: If present, patch changes are also recorded in the log.
* `--noLogv0`: If `true` (default), the log is not written when the major version is `0`, except for the initial log entry created when the changelog file is first initialized. Pass `--noLogv0` to enable it explicitly, or `--noLogv0=false` to disable it from the command line.
